<?php

namespace App\Exports;

use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class RentFollowUpExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(protected $data, protected $months) {}

    public function collection()
    {
        return collect($this->data);
    }

    public function title(): string
    {
        return 'Suivi des Loyers';
    }

    public function headings(): array
    {
        $headings = [
            'Bien Immobilier',
            'Locataire',
        ];

        foreach ($this->months as $month) {
            $headings[] = Carbon::parse($month.'-01')->format('M y');
        }

        return $headings;
    }

    public function map($row): array
    {
        $map = [
            $row['property_title'],
            $row['tenant_name'],
        ];

        foreach ($this->months as $month) {
            $map[] = $row['months'][$month]['label'];
        }

        return $map;
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

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $colors = [
                    'paid' => 'D1FAE5',
                    'unpaid' => 'FEE2E2',
                ];

                foreach (collect($this->data)->values() as $rowIndex => $row) {
                    foreach ($this->months as $monthIndex => $month) {
                        $status = $row['months'][$month]['status'];

                        if (! isset($colors[$status])) {
                            continue;
                        }

                        $cell = Coordinate::stringFromColumnIndex($monthIndex + 3).($rowIndex + 2);
                        $event->sheet->getDelegate()->getStyle($cell)->getFill()
                            ->setFillType(Fill::FILL_SOLID)
                            ->getStartColor()
                            ->setRGB($colors[$status]);
                    }
                }
            },
        ];
    }
}
