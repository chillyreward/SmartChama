import SmartGrowContent from "@/components/SmartGrowContent";

export default function AdminSmartGrowPage() {
  return (
    <div className="w-full page-bg min-h-screen">
      <SmartGrowContent isAdminRoute={true} />
    </div>
  );
}
