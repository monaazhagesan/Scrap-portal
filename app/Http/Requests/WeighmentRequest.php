<?php

namespace App\Http\Requests;

use App\Enums\WeighmentDirection;
use App\Support\CurrentOrganization;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class WeighmentRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'vehicle_number' => strtoupper(preg_replace('/\s+/', '', (string) $this->input('vehicle_number'))),
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
            'direction' => ['required', Rule::enum(WeighmentDirection::class)],
            'vehicle_number' => ['required', 'string', 'max:20'],
            'vehicle_type' => ['nullable', 'string', 'max:50'],
            'driver_name' => ['nullable', 'string', 'max:100'],
            'driver_phone' => ['nullable', 'string', 'max:20'],
            'party_id' => [
                'nullable',
                Rule::exists('parties', 'id')
                    ->where('organization_id', app(CurrentOrganization::class)->id())
                    ->where('is_active', true),
            ],
            'party_name' => ['nullable', 'string', 'max:255'],
            'material_id' => [
                'nullable',
                Rule::exists('materials', 'id')
                    ->where('organization_id', app(CurrentOrganization::class)->id())
                    ->whereIn('unit', ['kg', 'ton']),
            ],
            'first_weight' => ['required', 'numeric', 'gt:0', 'max:999999'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'material_id.exists' => 'Select a valid material sold by weight (kg / ton).',
            'party_id.exists' => 'Select a valid, active party.',
        ];
    }
}
