import Container from "@/app/Components/Container";
import Banner from "@/components/ui/banner";
import CollectionsClient from "./CollectionsClient";
import { prisma } from "@/lib/prisma";

// Disable static generation (for SSR)
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

type Product = {
  id: number;
  name: string;
  category: "male" | "female";
  subCategory: string;
  ageGroup: string;
  price: number;
  salePrice?: number;
  isNew?: boolean;
  isFeatured?: boolean;
  image: string;
  hoverImage?: string;
  description?: string;
};

type Filters = {
  male: {
    ageGroups: string[];
    subCategories: string[];
  };
  female: {
    ageGroups: string[];
    subCategories: string[];
  };
};

export default async function CollectionsPage() {
  let products: Product[] = [];
  let filters: Filters = {
    male: { ageGroups: [], subCategories: [] },
    female: { ageGroups: [], subCategories: [] },
  };

  try {
    console.log("🔍 Loading products directly from database via Prisma...");

    const [rawProducts, rawFilterData] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          category: true,
          ageGroup: true,
          subCategory: true,
        },
      }),
    ]);

    // Format products from Prisma schema types to page component props
    products = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category as "male" | "female",
      subCategory: p.subCategory,
      ageGroup: p.ageGroup,
      price: Number(p.price),
      isNew: p.isNew,
      isFeatured: p.isFeatured,
      image: p.image,
      hoverImage: p.hoverImage || undefined,
      description: p.description || undefined,
    }));

    // Process filters
    const filterSets = {
      male: {
        ageGroups: new Set<string>(),
        subCategories: new Set<string>(),
      },
      female: {
        ageGroups: new Set<string>(),
        subCategories: new Set<string>(),
      },
    };

    for (const item of rawFilterData) {
      const { category, ageGroup, subCategory } = item;
      if (
        (category === "male" || category === "female") &&
        ageGroup &&
        subCategory
      ) {
        filterSets[category].ageGroups.add(ageGroup);
        filterSets[category].subCategories.add(subCategory);
      }
    }

    filters = {
      male: {
        ageGroups: Array.from(filterSets.male.ageGroups),
        subCategories: Array.from(filterSets.male.subCategories),
      },
      female: {
        ageGroups: Array.from(filterSets.female.ageGroups),
        subCategories: Array.from(filterSets.female.subCategories),
      },
    };

    console.log(`✅ Loaded ${products.length} active products and filters successfully`);
  } catch (error) {
    console.error("❌ Error loading products or filters from database:", error);
  }

  return (
    <div>
      <Banner
        title="OUR COLLECTIONS"
        description="Discover our diverse range of traditional and modern outfits, crafted with precision and care to celebrate your unique style and cultural heritage."
      />

      <Container>
        <CollectionsClient products={products} filters={filters} />
      </Container>
    </div>
  );
}
