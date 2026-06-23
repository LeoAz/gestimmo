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

class ForecastExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(protected $data) {}

    public function collection()
    {
        return $this->data;
    }

    public function title(): string
    {
        return 'Prévisions de Recouvrement';
    }

    public function headings(): array
    {
        return [
            'Immeuble',
            'Bien Immobilier',
            'Locataire',
            'Période',
            'Montant prévu',
            'Montant recouvré',
            'Reste à recouvrer',
        ];
    }

    public function map($row): array
    {
        return [
            $row->building_title ?? '-',
            $row->property_title,
            $row->tenant_name,
            $row->period,
            $row->amount_expected.' FCFA',
            $row->amount_collected.' FCFA',
            ($row->amount_expected - $row->amount_collected).' FCFA',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '3B82F6'],
                ],
            ],
        ];
    }
}
