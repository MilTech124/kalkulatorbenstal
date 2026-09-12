import { PriceListEditor, type VersionInfo } from '@/components/panel/PriceListEditor';
import { getActivePriceList, listPriceListVersions } from '@/lib/pricing/repository';

export const dynamic = 'force-dynamic';

export default async function PriceListPage() {
  const [active, versionDocs] = await Promise.all([getActivePriceList(), listPriceListVersions()]);
  const versions: VersionInfo[] = versionDocs.map((v) => ({
    version: v.version,
    active: v.active,
    createdAt: (v.createdAt as Date).toISOString(),
  }));
  return <PriceListEditor initial={active.data} version={active.version} versions={versions} />;
}
