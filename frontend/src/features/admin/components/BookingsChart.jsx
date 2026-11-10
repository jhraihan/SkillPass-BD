import { ChartLine, TableProperties } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TrendChart from '@/components/domain/TrendChart';
import { Button, Card, Table } from '@/components/ui';
import { CHART_COLORS } from '@/lib/constants';
import { formatDate, formatNumber } from '@/lib/format';

export default function BookingsChart({ daily }) {
  const { t, i18n } = useTranslation('admin');
  const [asTable, setAsTable] = useState(false);
  const number = (value) => formatNumber(value, i18n.language);
  const shortDate = (value) => formatDate(value, i18n.language, { day: 'numeric', month: 'short' });
  const series = [
    { key: 'requested', label: t('dashboard.chart.requested'), color: CHART_COLORS.requested },
    { key: 'completed', label: t('dashboard.chart.completed'), color: CHART_COLORS.completed },
  ];

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-navy-700">{t('dashboard.chart.title')}</h2>
          <p className="text-sm text-gray-600">{t('dashboard.chart.subtitle')}</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          icon={asTable ? ChartLine : TableProperties}
          onClick={() => setAsTable((value) => !value)}
        >
          {t(asTable ? 'dashboard.chart.showChart' : 'dashboard.chart.showTable')}
        </Button>
      </div>

      {asTable ? (
        <Table
          rowKey="date"
          rows={[...daily].reverse()}
          columns={[
            {
              key: 'date',
              header: t('dashboard.chart.date'),
              render: (row) => shortDate(row.date),
            },
            ...series.map((item) => ({
              key: item.key,
              header: item.label,
              render: (row) => number(row[item.key]),
            })),
          ]}
          className="max-h-80 overflow-y-auto"
        />
      ) : (
        <TrendChart
          data={daily}
          xKey="date"
          series={series}
          formatX={shortDate}
          formatValue={number}
          label={t('dashboard.chart.title')}
        />
      )}
    </Card>
  );
}
