import GlobalLayout from '../components/layout/GlobalLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const Dashboard = () => (
  <GlobalLayout>
    <PageHeader
      title="Dashboard"
      badges={<Badge tone="success" dot>Live</Badge>}
      subtitle="Ringkasan konten Excellence Plus Indonesia"
    />

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card title="Selamat datang">
          <p className="text-[0.8125rem] text-[var(--p-text-secondary)]">
            Kelola artikel, halaman layanan, dan media dari satu tempat. Perubahan
            yang dipublikasikan akan tayang di situs setelah proses build selesai.
          </p>
        </Card>

        <Card title="Mulai dari mana">
          <ul className="divide-y divide-[var(--p-border)] text-[0.8125rem]">
            <li className="flex items-center gap-3 py-2.5">
              <i className="fa fa-layer-group w-4 text-center text-[var(--p-text-secondary)]" aria-hidden="true" />
              <span className="flex-1">Isi halaman layanan mengikuti templatenya</span>
              <Badge>Segera</Badge>
            </li>
            <li className="flex items-center gap-3 py-2.5">
              <i className="fa fa-newspaper w-4 text-center text-[var(--p-text-secondary)]" aria-hidden="true" />
              <span className="flex-1">Tulis artikel untuk blog</span>
            </li>
            <li className="flex items-center gap-3 py-2.5">
              <i className="fa fa-images w-4 text-center text-[var(--p-text-secondary)]" aria-hidden="true" />
              <span className="flex-1">Unggah gambar ke pustaka media</span>
            </li>
          </ul>
        </Card>
      </div>

      <div className="space-y-4">
        <Card title="Situs">
          <dl className="space-y-2 text-[0.8125rem]">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--p-text-secondary)]">Domain</dt>
              <dd>
                <a
                  className="text-[var(--p-link)] hover:underline"
                  href="https://excellenceplus.id"
                  target="_blank"
                  rel="noreferrer"
                >
                  excellenceplus.id
                </a>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--p-text-secondary)]">Panel</dt>
              <dd className="text-[var(--p-text)]">/admin</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  </GlobalLayout>
);

export default Dashboard;
