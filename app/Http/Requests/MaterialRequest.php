<?php

namespace App\Http\Requests;

use App\Enums\MaterialCategory;
use App\Models\Material;
use App\Support\CurrentOrganization;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MaterialRequest extends FormRequest
{
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
                Rule::unique('materials')
                    ->where('organization_id', app(CurrentOrganization::class)->id())
                    ->ignore($this->route('material')),
            ],
            'code' => ['nullable', 'string', 'max:50'],
            'category' => ['required', Rule::enum(MaterialCategory::class)],
            'unit' => ['required', Rule::in(Material::UNITS)],
            'purchase_rate' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'sale_rate' => ['required', 'numeric', 'min:0', 'max:9999999999'],
            'is_active' => ['boolean'],
        ];
    }
}
