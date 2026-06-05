@extends('reports.pdf.layout')

@section('content')
<table style="border-top: 4px solid #3B82F6;">
    <thead style="background-color: #3B82F6;">
        <tr>
            <th>Bien Immobilier</th>
            <th>Locataire</th>
            <th>Période</th>
            <th class="text-right">Prévu</th>
            <th class="text-right">Recouvré</th>
            <th class="text-right">Reste</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $row)
        <tr>
            <td>{{ $row->property_title }}</td>
            <td>{{ $row->tenant_name }}</td>
            <td>{{ $row->period }}</td>
            <td class="text-right">{{ number_format($row->amount_expected, 0, ',', ' ') }} FCFA</td>
            <td class="text-right">{{ number_format($row->amount_collected, 0, ',', ' ') }} FCFA</td>
            <td class="text-right font-bold {{ $row->amount_expected - $row->amount_collected > 0 ? 'text-red' : '' }}">
                {{ number_format($row->amount_expected - $row->amount_collected, 0, ',', ' ') }} FCFA
            </td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr>
            <td colspan="3" class="text-right font-bold">Totaux</td>
            <td class="text-right font-bold">{{ number_format($data->sum('amount_expected'), 0, ',', ' ') }} FCFA</td>
            <td class="text-right font-bold">{{ number_format($data->sum('amount_collected'), 0, ',', ' ') }} FCFA</td>
            <td class="text-right font-bold">{{ number_format($data->sum('amount_expected') - $data->sum('amount_collected'), 0, ',', ' ') }} FCFA</td>
        </tr>
    </tfoot>
</table>

<div style="margin-top: 20px; background: #EFF6FF; padding: 15px; border-radius: 8px;">
    <p><strong>Performance du recouvrement :</strong></p>
    <div style="font-size: 18px; font-weight: bold; color: #1E40AF;">
        @php
            $totalExpected = $data->sum('amount_expected');
            $totalCollected = $data->sum('amount_collected');
            $percentage = $totalExpected > 0 ? round(($totalCollected / $totalExpected) * 100, 2) : 0;
        @endphp
        Taux de recouvrement : {{ $percentage }}%
    </div>
</div>

<style>
    .text-red { color: #DC2626; }
</style>
@endsection
