<?php

namespace App\Http\Controllers;

use App\Enums\PaymentMode;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Models\Party;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AccountsController extends Controller
{
    public function outstanding(): Response
    {
        $present = fn (Party $party) => [
            ...$party->only(['id', 'name', 'phone']),
            'type_label' => $party->type->label(),
            'balance' => round((float) $party->balance, 2),
        ];

        $receivables = Party::query()->withBalance()->receivable()->orderByDesc('balance')->get()->map($present);
        $payables = Party::query()->withBalance()->payable()->orderBy('balance')->get()->map($present);

        return Inertia::render('accounts/outstanding', [
            'receivables' => $receivables,
            'payables' => $payables,
            'totals' => [
                'receivable' => round($receivables->sum('balance'), 2),
                'payable' => round(abs($payables->sum('balance')), 2),
            ],
        ]);
    }

    /**
     * Cash book (mode = cash) or bank book (UPI, bank transfer, cheque) from posted vouchers.
     */
    public function cashbook(Request $request): Response
    {
        $filters = $request->validate([
            'book' => ['nullable', Rule::in(['cash', 'bank'])],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $book = $filters['book'] ?? 'cash';
        $from = $filters['from'] ?? today()->startOfMonth()->toDateString();
        $to = $filters['to'] ?? today()->toDateString();

        $vouchers = fn () => Payment::query()
            ->where('status', PaymentStatus::Posted)
            ->when(
                $book === 'cash',
                fn (Builder $query) => $query->where('mode', PaymentMode::Cash),
                fn (Builder $query) => $query->where('mode', '!=', PaymentMode::Cash),
            );

        // Receipts add to the book, payments take away.
        $signed = DB::raw("case when type = '".PaymentType::Receipt->value."' then amount else -amount end");

        $opening = (float) $vouchers()->whereDate('date', '<', $from)->sum($signed);

        $balance = $opening;
        $rows = $vouchers()
            ->with('party:id,name')
            ->whereDate('date', '>=', $from)
            ->whereDate('date', '<=', $to)
            ->orderBy('date')
            ->orderBy('id')
            ->get()
            ->map(function (Payment $payment) use (&$balance) {
                $in = $payment->type === PaymentType::Receipt ? (float) $payment->amount : 0.0;
                $out = $payment->type === PaymentType::Payment ? (float) $payment->amount : 0.0;
                $balance += $in - $out;

                return [
                    'id' => $payment->id,
                    'date' => $payment->date->toDateString(),
                    'voucher_no' => $payment->voucher_no,
                    'party' => $payment->party->name,
                    'mode_label' => $payment->mode->label(),
                    'reference_no' => $payment->reference_no,
                    'in' => $in,
                    'out' => $out,
                    'balance' => round($balance, 2),
                ];
            });

        return Inertia::render('accounts/cashbook', [
            'rows' => $rows,
            'filters' => ['book' => $book, 'from' => $from, 'to' => $to],
            'summary' => [
                'opening' => round($opening, 2),
                'in' => round($rows->sum('in'), 2),
                'out' => round($rows->sum('out'), 2),
                'closing' => round($balance, 2),
            ],
        ]);
    }
}
