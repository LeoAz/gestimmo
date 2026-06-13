<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ExpensesExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(protected $data) {}

    public function collection()
    {
        return $this->data;
    }

    public function title(): string
    {
        return 'Rapport de Dépenses';
    }

    public function headings(): array
    {
        return [
            'Référence',
            'Date',
            'Prestataire',
            'Bien Immobilier',
            'Montant Total',
            'Notes',
        ];
    }

    public function map($expense): array
    {
        return [
            $expense->reference,
            $expense->date->format('d/m/Y'),
            $expense->provider,
            $expense->property ? $expense->property->title : 'N/A',
            $expense->total_amount.' FCFA',
            $expense->notes,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'EF4444'], // Red for expenses
                ],
            ],
        ];
    }
}
