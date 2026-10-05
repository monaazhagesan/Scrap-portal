<?php

namespace App\Http\Controllers;

use App\Enums\OrganizationRole;
use App\Enums\WeighmentDirection;
use App\Enums\WeighmentStatus;
use App\Http\Requests\WeighmentRequest;
use App\Models\Material;
use App\Models\Party;
use App\Models\Weighment;
use App\Support\CurrentOrganization;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WeighmentController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(WeighmentStatus::class)],
            'direction' => ['nullable', Rule::enum(WeighmentDirection::class)],
            'date' => ['nullable', 'date'],
        ]);

        $weighments = Weighment::query()
            ->with('material:id,name,unit')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->where('ticket_no', 'like', "%{$search}%")
                ->orWhere('vehicle_number', 'like', '%'.strtoupper(str_replace(' ', '', $search)).'%')
                ->orWhere('party_name', 'like', "%{$search}%")))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['direction'] ?? null, fn ($query, $direction) => $query->where('direction', $direction))
            ->when($filters['date'] ?? null, fn ($query, $date) => $query->whereDate('first_weighed_at', $date))
            ->latest('id')
            ->paginate(20)
            ->withQueryString();

        $today = Weighment::query()
            ->whereDate('first_weighed_at', today())
            ->where('status', '!=', WeighmentStatus::Cancelled)
            ->selectRaw('direction, status, count(*) as tickets, coalesce(sum(net_weight), 0) as net')
            ->groupBy('direction', 'status')
            ->get();

        return Inertia::render('weighments/index', [
            'weighments' => $weighments,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? '',
                'direction' => $filters['direction'] ?? '',
                'date' => $filters['date'] ?? '',
            ],
            'statuses' => WeighmentStatus::options(),
            'directions' => WeighmentDirection::options(),
            'today' => [
                'inwardTickets' => (int) $today->where('direction', WeighmentDirection::Inward)->sum('tickets'),
                'inwardNet' => (float) $today->where('direction', WeighmentDirection::Inward)->sum('net'),
                'outwardTickets' => (int) $today->where('direction', WeighmentDirection::Outward)->sum('tickets'),
                'outwardNet' => (float) $today->where('direction', WeighmentDirection::Outward)->sum('net'),
                'open' => Weighment::where('status', WeighmentStatus::Open)->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('weighments/create', [
            'directions' => WeighmentDirection::options(),
            'materials' => Material::query()
                ->where('is_active', true)
                ->whereIn('unit', ['kg', 'ton'])
                ->orderBy('name')
                ->get(['id', 'name', 'unit', 'purchase_rate', 'sale_rate']),
            'parties' => Party::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'type']),
        ]);
    }

    public function store(WeighmentRequest $request, CurrentOrganization $tenant): RedirectResponse
    {
        $weighment = Weighment::open($tenant->get(), $request->user(), $request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Ticket :no created. First weight recorded.', ['no' => $weighment->ticket_no])]);

        return to_route('weighments.show', $weighment);
    }

    public function show(Request $request, Weighment $weighment, CurrentOrganization $tenant): Response
    {
        $weighment->load(['material:id,name,unit,purchase_rate,sale_rate', 'creator:id,name', 'completer:id,name']);

        return Inertia::render('weighments/show', [
            'weighment' => [
                ...$weighment->toArray(),
                'direction_label' => $weighment->direction->label(),
                'status_label' => $weighment->status->label(),
                'default_rate' => $weighment->defaultRate(),
            ],
            'organization' => $tenant->get()->only(['name', 'address', 'phone', 'tax_number']),
            'canCancel' => $this->canCancel($request, $tenant) && $weighment->status !== WeighmentStatus::Cancelled,
        ]);
    }

    public function complete(Request $request, Weighment $weighment): RedirectResponse
    {
        $validated = $request->validate([
            'second_weight' => ['required', 'numeric', 'gt:0', 'max:999999'],
            'deduction' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'rate' => ['nullable', 'numeric', 'min:0', 'max:9999999999'],
        ]);

        $weighment->complete(
            (float) $validated['second_weight'],
            (float) ($validated['deduction'] ?? 0),
            isset($validated['rate']) ? (float) $validated['rate'] : null,
            $request->user(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Ticket :no completed.', ['no' => $weighment->ticket_no])]);

        return to_route('weighments.show', $weighment);
    }

    public function cancel(Request $request, Weighment $weighment, CurrentOrganization $tenant): RedirectResponse
    {
        abort_unless($this->canCancel($request, $tenant), 403);
        abort_if($weighment->status === WeighmentStatus::Cancelled, 422);

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $weighment->cancel($validated['reason'], $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Ticket :no cancelled.', ['no' => $weighment->ticket_no])]);

        return to_route('weighments.show', $weighment);
    }

    protected function canCancel(Request $request, CurrentOrganization $tenant): bool
    {
        $role = $tenant->get()->roleOf($request->user());

        return in_array($role, [OrganizationRole::Owner, OrganizationRole::Admin, OrganizationRole::Manager], true);
    }
}
