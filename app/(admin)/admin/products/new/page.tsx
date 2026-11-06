import { adminContext } from "@/src/lib/admin/context";
import { createProduct } from "@/src/lib/admin/actions/products";
import { Denied, PageHeader } from "@/src/components/admin/ui";

export const metadata = { title: "Yeni məhsul" };

export default async function NewProduct({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { readOnly } = await adminContext();
  const sp = await searchParams;
  return (
    <>
      <PageHeader
        title="Yeni məhsul"
        description="Qaralama kimi yaradılır; mətnləri, şəkilləri və kateqoriyaları sonra əlavə edin."
      />
      <Denied show={sp.denied === "1"} />
      {sp.error === "sku" && (
        <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          Bu artikul artıq mövcuddur.
        </p>
      )}
      <form action={createProduct} className="card max-w-lg space-y-4 p-6">
        <fieldset disabled={readOnly} className="space-y-4">
          <label className="block">
            <span className="label">Artikul (SKU)</span>
            <input
              name="sku"
              required
              pattern="[A-Za-z0-9-]+"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Ad (ingiliscə, mənbə dil)</span>
            <input name="name" required className="input" />
          </label>
          <button className="btn-primary">Yarat</button>
        </fieldset>
      </form>
    </>
  );
}
