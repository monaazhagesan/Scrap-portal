<?php

namespace App\Http\Controllers;

use App\Enums\OrganizationRole;
use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\Party;
use App\Models\Payment;
use App\Support\CurrentOrganization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::enum(PaymentType::class)],
            'mode' => ['nullable', Rule::enum(PaymentMode::class)],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        $payments = Payment::query()
            ->with('party:id,name')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->where('voucher_no', 'like', "%{$search}%")
                ->orWhere('reference_no', 'like', "%{$search}%")
                ->orWhereHas('party', fn ($query) => $query->where('name', 'like', "%{$search}%"))))
            ->when($filters['type'] ?? null, fn ($query, $type) => $query->where('type', $type))
            ->when($filters['mode'] ?? null, fn ($query, $mode) => $query->where('mode', $mode))
            ->when($filters['from'] ?? null, fn ($query, $from) => $query->whereDate('date', '>=', $from))
            ->when($filters['to'] ?? null, fn ($query, $to) => $query->whereDate('date', '<=', $to))
            ->latest('date')
            ->latest('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Payment $payment) => $this->present($payment));

        return Inertia::render('payments/index', [
            'payments' => $payments,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'type' => $filters['type'] ?? '',
                'mode' => $filters['mode'] ?? '',
                'from' => $filters['from'] ?? '',
                'to' => $filters['to'] ?? '',
            ],
            'types' => PaymentType::options(),
            'modes' => PaymentMode::options(),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('payments/create', [
            'parties' => Party::query()
                ->withBalance()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (Party $party) => [
                    'id' => $party->id,
                    'name' => $party->name,
                    'balance' => round((float) $party->balance, 2),
                ]),
            'types' => PaymentType::options(),
            'modes' => PaymentMode::options(),
            'defaults' => [
                'party_id' => $request->integer('party') ?: null,
                'type' => PaymentType::tryFrom((string) $request->query('type'))?->value,
                'date' => today()->toDateString(),
            ],
        ]);
    }

    public function store(Request $request, CurrentOrganization $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::enum(PaymentType::class)],
            'party_id' => ['required', Rule::exists('parties', 'id')->where('organization_id', $tenant->id())],
            'date' => ['required', 'date', 'before_or_equal:today'],
            'amount' => ['required', 'numeric', 'gt:0', 'max:999999999999'],
            'mode' => ['required', Rule::enum(PaymentMode::class)],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $payment = Payment::post(Party::whereKey($validated['party_id'])->firstOrFail(), $request->user(), $validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':type :no saved.', [
            'type' => $payment->type->label(),
            'no' => $payment->voucher_no,
        ])]);

        return to_route('payments.show', $payment);
    }

    public function show(Request $request, Payment $payment, CurrentOrganization $tenant): Response
    {
        $payment->load(['party', 'creator:id,name']);

        return Inertia::render('payments/show', [
            'payment' => [
                ...$this->present($payment),
                'notes' => $payment->notes,
                'created_by_name' => $payment->creator?->name,
                'party' => [
                    ...$payment->party->only(['id', 'name', 'phone', 'gstin', 'address']),
                    'balance' => round($payment->party->currentBalance(), 2),
                ],
            ],
            'organization' => $tenant->get()->only(['name', 'address', 'phone', 'tax_number']),
            'canCancel' => $payment->status === PaymentStatus::Posted
                && $tenant->get()->userHasRole($request->user(), OrganizationRole::Owner, OrganizationRole::Admin),
        ]);
    }

    public function cancel(Request $request, Payment $payment, CurrentOrganization $tenant): RedirectResponse
    {
        abort_unless($tenant->get()->userHasRole($request->user(), OrganizationRole::Owner, OrganizationRole::Admin), 403);
        abort_if($payment->status === PaymentStatus::Cancelled, 422);

        $validated = $request->validate(['reason' => ['required', 'string', 'max:255']]);

        $payment->cancel($validated['reason'], $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Voucher :no cancelled.', ['no' => $payment->voucher_no])]);

        return to_route('payments.show', $payment);
    }

    /**
     * @return array<string, mixed>
     */
    protected function present(Payment $payment): array
    {
        return [
            ...$payment->only(['id', 'voucher_no', 'amount', 'reference_no']),
            'date' => $payment->date->toDateString(),
            'type' => $payment->type->value,
            'type_label' => $payment->type->label(),
            'mode' => $payment->mode->value,
            'mode_label' => $payment->mode->label(),
            'status' => $payment->status->value,
            'party' => $payment->party->only(['id', 'name']),
        ];
    }
}
