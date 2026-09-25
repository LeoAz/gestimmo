@extends('reports.pdf.layout')

@section('content')
<style>
    .month-cell {
        text-align: center;
        font-size: 9px;
    }
    .total-row {
        background-color: #f3f4f6;
        font-weight: bold;
    }
    .status-paid {
        background-color: #d1fae5;
        color: #065f46;
    }
    .status-unpaid {
        background-color: #fee2e2;
        color: #991b1b;
    }
    .status-zero {
        background-color: #ffedd5;
        color: #c2410c;
    }
</style>

<table>
    <thead>
        <tr>
            <th>Bien Immobilier</th>
            <th>Locataire</th>
            @foreach($months as $month)
                <th class="month-cell">{{ \Illuminate\Support\Carbon::parse($month . '-01')->format('M y') }}</th>
            @endforeach
        </tr>
    </thead>
    <tbody>
        @foreach($data as $row)
            <tr>
                <td>
                    {{ $row['property_title'] }}
                </td>
                <td>{{ $row['tenant_name'] }}</td>
                @foreach($months as $month)
                    @php
                        $monthData = $row['months'][$month];
                    @endphp
                    <td class="month-cell status-{{ (float) $monthData['amount'] === 0.0 ? 'zero' : str_replace('_', '-', $monthData['status']) }}">
                        {{ $monthData['label'] }}
                    </td>
                @endforeach
            </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr class="total-row">
            <td colspan="2" class="text-right">TOTAL</td>
            @foreach($months as $month)
                @php
                    $total = 0;
                    foreach($data as $row) {
                        $total += $row['months'][$month]['amount'];
                    }
                @endphp
                <td class="month-cell {{ (float) $total === 0.0 ? 'status-zero' : '' }}">{{ number_format($total, 0, '.', ' ') }} F</td>
            @endforeach
        </tr>
    </tfoot>
</table>

@endsection
