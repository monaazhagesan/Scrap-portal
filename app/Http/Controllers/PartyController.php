<?php

namespace App\Http\Controllers;

use App\Enums\PartyType;
use App\Http\Requests\PartyRequest;
use App\Models\LedgerEntry;
use App\Models\Party;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PartyController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::enum(PartyType::class)],
            'balance' => ['nullable', Rule::in(['receivable', 'payable'])],
        ]);

        $parties = Party::query()
            ->withBalance()
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
                ->orWhere('gstin', 'like', "%{$search}%")))
            ->when($filters['type'] ?? null, fn ($query, $type) => $query->where('type', $type))
            ->when(($filters['balance'] ?? null) === 'receivable', fn ($query) => $query->receivable())
            ->when(($filters['balance'] ?? null) === 'payable', fn ($query) => $query->payable())
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Party $party) => [
                ...$party->only(['id', 'name', 'phone', 'gstin', 'is_active']),
                'type' => $party->type->value,
                'type_label' => $party->type->label(),
                'balance' => round((float) $party->balance, 2),
            ]);

        return Inertia::render('parties/index', [
            'parties' => $parties,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'type' => $filters['type'] ?? '',
                'balance' => $filters['balance'] ?? '',
            ],
            'types' => PartyType::options(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('parties/create', ['types' => PartyType::options()]);
    }

    public function store(PartyRequest $request): RedirectResponse
    {
        $party = Party::create($request->partyAttributes());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Party :name created.', ['name' => $party->name])]);

        return to_route('parties.show', $party);
    }

    /**
     * Account statement with running balance.
     */
    public function show(Request $request, Party $party): Response
    {
        $filters = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);
        $from = $filters['from'] ?? null;
        $to = $filters['to'] ?? null;

        $inRange = fn () => $party->ledgerEntries()
            ->when($from, fn ($query) => $query->whereDate('date', '>=', $from))
            ->when($to, fn ($query) => $query->whereDate('date', '<=', $to));

        $opening = (float) $party->opening_balance
            + ($from ? (float) $party->ledgerEntries()->whereDate('date', '<', $from)->sum(DB::raw('debit - credit')) : 0);

        $entries = $inRange()
            ->with(['weighment:id,ticket_no', 'payment:id,voucher_no'])
            ->orderBy('date')
            ->orderBy('id')
            ->paginate(50)
            ->withQueryString();

        $first = $entries->first();
        $running = $opening + ($first ? (float) $inRange()
            ->where(fn ($query) => $query
                ->whereDate('date', '<', $first->date)
                ->orWhere(fn ($query) => $query->whereDate('date', $first->date)->where('id', '<', $first->id)))
            ->sum(DB::raw('debit - credit')) : 0);

        $entries->through(function (LedgerEntry $entry) use (&$running) {
            $running += (float) $entry->debit - (float) $entry->credit;

            return [
                ...$entry->only(['id', 'debit', 'credit', 'narration', 'weighment', 'payment']),
                'date' => $entry->date->toDateString(),
                'type' => $entry->type->value,
                'type_label' => $entry->type->label(),
                'balance' => round($running, 2),
            ];
        });

        $totalDebit = (float) $inRange()->sum('debit');
        $totalCredit = (float) $inRange()->sum('credit');

        return Inertia::render('parties/show', [
            'party' => [
                ...$party->only(['id', 'name', 'phone', 'email', 'gstin', 'pan', 'address', 'state', 'opening_balance', 'is_active']),
                'type' => $party->type->value,
                'type_label' => $party->type->label(),
                'balance' => round($party->currentBalance(), 2),
            ],
            'entries' => $entries,
            'filters' => ['from' => $from ?? '', 'to' => $to ?? ''],
            'statement' => [
                'opening' => round($opening, 2),
                'debit' => round($totalDebit, 2),
                'credit' => round($totalCredit, 2),
                'closing' => round($opening + $totalDebit - $totalCredit, 2),
            ],
            'organization' => $request->user()->currentOrganization?->only(['name', 'address', 'phone', 'tax_number']),
        ]);
    }

    public function edit(Party $party): Response
    {
        return Inertia::render('parties/edit', [
            'party' => [
                ...$party->only(['id', 'name', 'phone', 'email', 'gstin', 'pan', 'address', 'state', 'is_active']),
                'type' => $party->type->value,
                'opening_amount' => abs((float) $party->opening_balance),
                'opening_type' => (float) $party->opening_balance < 0 ? 'payable' : 'receivable',
            ],
            'types' => PartyType::options(),
        ]);
    }

    public function update(PartyRequest $request, Party $party): RedirectResponse
    {
        $party->update($request->partyAttributes());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Party updated.')]);

        return to_route('parties.show', $party);
    }
}
