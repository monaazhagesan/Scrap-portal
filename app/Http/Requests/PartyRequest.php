<?php

namespace App\Http\Requests;

use App\Enums\PartyType;
use App\Support\CurrentOrganization;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PartyRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'gstin' => $this->filled('gstin') ? strtoupper(trim((string) $this->input('gstin'))) : null,
            'pan' => $this->filled('pan') ? strtoupper(trim((string) $this->input('pan'))) : null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('parties')
                    ->where('organization_id', app(CurrentOrganization::class)->id())
                    ->ignore($this->route('party')),
            ],
            'type' => ['required', Rule::enum(PartyType::class)],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'gstin' => ['nullable', 'regex:/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/'],
            'pan' => ['nullable', 'regex:/^[A-Z]{5}[0-9]{4}[A-Z]$/'],
            'address' => ['nullable', 'string', 'max:1000'],
            'state' => ['nullable', 'string', 'max:100'],
            'opening_amount' => ['nullable', 'numeric', 'min:0', 'max:999999999999'],
            'opening_type' => ['required_with:opening_amount', Rule::in(['receivable', 'payable'])],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'gstin.regex' => 'Enter a valid 15-character GSTIN, e.g. 33AAAAA0000A1Z5.',
            'pan.regex' => 'Enter a valid 10-character PAN, e.g. AAAAA0000A.',
        ];
    }

    /**
     * Validated attributes ready for the Party model (opening balance as a signed amount).
     *
     * @return array<string, mixed>
     */
    public function partyAttributes(): array
    {
        $data = $this->safe()->except(['opening_amount', 'opening_type']);
        $amount = (float) ($this->validated('opening_amount') ?? 0);

        $data['opening_balance'] = $this->validated('opening_type') === 'payable' ? -$amount : $amount;

        return $data;
    }
}
