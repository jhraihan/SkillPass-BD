import { Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/api/errors';
import {
  Badge,
  Button,
  ConfirmDialog,
  ErrorState,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  Table,
  useToast,
} from '@/components/ui';
import {
  useAreas,
  useCategories,
  useDeleteCatalogItem,
  useSaveCatalogItem,
  useSkills,
} from '@/hooks/catalog';
import { cn } from '@/lib/cn';
import { localName } from '@/lib/format';
import CatalogForm from '../components/CatalogForm';

const TABS = ['categories', 'skills', 'areas'];

export default function CatalogPage() {
  const { t, i18n } = useTranslation('admin');
  const toast = useToast();
  const [tab, setTab] = useState('categories');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const categories = useCategories({ includeInactive: true });
  const skills = useSkills({ category: categoryFilter || undefined, includeInactive: true });
  const areas = useAreas({ includeInactive: true });
  const query = { categories, skills, areas }[tab];
  const save = useSaveCatalogItem(tab);
  const remove = useDeleteCatalogItem(tab);

  const name = (item) => localName(item, i18n.language);
  const notifyError = (error) => toast.error(getErrorMessage(error, t));

  const toggleActive = (item) =>
    save.mutate(
      { id: item.id, is_active: !item.is_active },
      { onSuccess: () => toast.success(t('catalog.statusChanged')), onError: notifyError },
    );

  const confirmDelete = () =>
    remove.mutate(deleting.id, {
      onSuccess: () => toast.success(t('catalog.deleted')),
      onError: notifyError,
      onSettled: () => setDeleting(null),
    });

  const parentOf = (item) => {
    if (tab === 'skills') return name(categories.data?.find((c) => c.id === item.category));
    if (tab === 'areas') return name(item.district_detail);
    return t('catalog.skillCount', { count: item.skill_count ?? 0 });
  };

  const columns = [
    {
      key: 'name',
      header: t('catalog.columns.name'),
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.name_bn}</p>
          <p className="text-gray-500">{item.name_en}</p>
        </div>
      ),
    },
    { key: 'parent', header: t('catalog.columns.parent'), render: parentOf },
    { key: 'slug', header: t('catalog.columns.slug'), className: 'font-mono text-xs' },
    {
      key: 'status',
      header: t('catalog.columns.status'),
      render: (item) => (
        <Badge tone={item.is_active ? 'green' : 'gray'} size="sm">
          {t(item.is_active ? 'catalog.status.active' : 'catalog.status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('catalog.columns.actions'),
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEditing(item)}>
            {t('catalog.actions.edit')}
          </Button>
          <Button size="sm" variant="ghost" icon={Power} onClick={() => toggleActive(item)}>
            {t(item.is_active ? 'catalog.actions.deactivate' : 'catalog.actions.activate')}
          </Button>
          <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleting(item)}>
            {t('catalog.actions.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('catalog.title')}
        description={t('catalog.description')}
        actions={
          <Button icon={Plus} onClick={() => setEditing({})}>
            {t(`catalog.add.${tab}`)}
          </Button>
        }
      />

      <div role="tablist" className="mb-4 flex flex-wrap items-end gap-2">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'min-h-11 rounded-xl px-4 font-medium',
              tab === key ? 'bg-brand-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            {t(`catalog.tabs.${key}`)}
          </button>
        ))}
        {tab === 'skills' && (
          <Select
            aria-label={t('catalog.filterCategory')}
            className="ml-auto w-56"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            options={[
              { value: '', label: t('catalog.allCategories') },
              ...(categories.data ?? []).map((c) => ({ value: c.slug, label: name(c) })),
            ]}
          />
        )}
      </div>

      {query.isPending && <LoadingState />}
      {query.isError && <ErrorState onRetry={query.refetch} />}
      {query.data && <Table columns={columns} rows={query.data} emptyText={t('catalog.empty')} />}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={t(editing?.id ? `catalog.edit.${tab}` : `catalog.add.${tab}`)}
      >
        {editing && (
          <CatalogForm
            resource={tab}
            item={editing.id ? editing : null}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title={t('catalog.confirmDelete.title')}
        message={t('catalog.confirmDelete.message', { name: deleting ? name(deleting) : '' })}
        confirmLabel={t('catalog.actions.delete')}
      />
    </div>
  );
}
