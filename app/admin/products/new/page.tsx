"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Container from "@/app/Components/Container";
import ImageUpload from "@/components/admin/ImageUpload";
import type { Product } from "@/data/products";
import { maleCategories, femaleCategories } from "@/data/products";

const ageGroups = ["adult", "children", "baby"] as const;
const categories = ["male", "female"] as const;

type ProductFormState = Omit<
  Product,
  "id" | "isNew" | "isFeatured" | "salePrice"
> & {
  isNew: "true" | "false";
  isFeatured: "true" | "false";
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormState>({
    name: "",
    category: "male",
    subCategory: "senator",
    ageGroup: "adult",
    price: 0,
    isNew: "false",
    isFeatured: "false",
    image: "",
    hoverImage: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get subcategories based on selected category
  const subCategoryOptions =
    form.category === "male"
      ? Object.entries(maleCategories)
      : Object.entries(femaleCategories);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const target = e.target;
    if (type === "checkbox" && target instanceof HTMLInputElement) {
      setForm((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // Prepare data with correct types
    const payload: Omit<Product, "id"> = {
      ...form,
      price: Number(form.price),
      isNew: form.isNew === "true",
      isFeatured: form.isFeatured === "true",
    };
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Failed to add product. " + (await res.text()));
      return;
    }
    router.push("/admin/products");
  };

  return (
    <Container>
      <div className="py-10 max-w-xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Add New Product</h1>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Back
          </Button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-white p-6 rounded-xl shadow"
        >
          <div>
            <label
              className="block mb-1 font-medium text-[#46332E]"
              htmlFor="name"
            >
              Product Name
            </label>
            <input
              id="name"
              name="name"
              placeholder="Enter product name"
              value={form.name || ""}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46332E] focus:border-transparent"
              required
            />
          </div>
          <div>
            <label
              htmlFor="category"
              className="block mb-1 font-medium text-[#46332E]"
            >
              Category
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46332E] focus:border-transparent"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="subCategory"
              className="block mb-1 font-medium text-[#46332E]"
            >
              Sub Category
            </label>
            <select
              id="subCategory"
              name="subCategory"
              value={form.subCategory}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46332E] focus:border-transparent"
              required
            >
              {subCategoryOptions.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ageGroup"
              className="block mb-1 font-medium text-[#46332E]"
            >
              Age Group
            </label>
            <select
              id="ageGroup"
              name="ageGroup"
              value={form.ageGroup}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46332E] focus:border-transparent"
              required
            >
              {ageGroups.map((ag) => (
                <option key={ag} value={ag}>
                  {ag.charAt(0).toUpperCase() + ag.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block mb-1 font-medium text-[#46332E]"
              htmlFor="price"
            >
              Regular Price
            </label>
            <input
              id="price"
              name="price"
              type="number"
              placeholder="Enter regular price"
              value={form.price}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46332E] focus:border-transparent"
              required
              min={0}
              step="0.01"
            />
          </div>

          <ImageUpload
            label="Product Image"
            onUploadSuccess={(url) => setForm((prev) => ({ ...prev, image: url }))}
            currentImage={form.image}
          />

          <ImageUpload
            label="Hover Image (Optional)"
            onUploadSuccess={(url) => setForm((prev) => ({ ...prev, hoverImage: url }))}
            currentImage={form.hoverImage}
          />

          <div>
            <label
              className="block mb-1 font-medium text-[#46332E]"
              htmlFor="description"
            >
              Product Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter product description"
              value={form.description || ""}
              onChange={handleChange}
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#46332E] focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isNew"
                name="isNew"
                checked={form.isNew === "true"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isNew: e.target.checked ? "true" : "false",
                  }))
                }
                className="w-4 h-4 text-[#46332E] border-gray-300 rounded focus:ring-[#46332E]"
              />
              <label
                htmlFor="isNew"
                className="text-sm font-medium text-[#46332E]"
              >
                Mark as New
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={form.isFeatured === "true"}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isFeatured: e.target.checked ? "true" : "false",
                  }))
                }
                className="w-4 h-4 text-[#46332E] border-gray-300 rounded focus:ring-[#46332E]"
              />
              <label
                htmlFor="isFeatured"
                className="text-sm font-medium text-[#46332E]"
              >
                Mark as Featured
              </label>
            </div>
          </div>
          {error && (
            <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <Button
            type="submit"
            className="w-full bg-[#46332E] hover:bg-[#46332E]/90 text-white py-3 text-lg rounded-xl transition-all duration-300"
            disabled={loading}
          >
            {loading ? "Adding Product..." : "Add Product"}
          </Button>
        </form>
      </div>
    </Container>
  );
}
