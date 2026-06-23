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

class LatePaymentsExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(protected $data) {}

    public function collection()
    {
        return $this->data;
    }

    public function title(): string
    {
        return 'Retards de Paiement';
    }

    public function headings(): array
    {
        return [
            'N° Facture',
            'Immeuble',
            'Bien Immobilier',
            'Locataire',
            'Date d\'échéance',
            'Jours de retard',
            'Montant dû',
        ];
    }

    public function map($row): array
    {
        return [
            $row->invoice_number,
            $row->building_title ?? '-',
            $row->property_title,
            $row->tenant_name,
            $row->due_date,
            $row->days_late,
            $row->amount_due.' FCFA',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5'],
                ],
            ],
        ];
    }
}
