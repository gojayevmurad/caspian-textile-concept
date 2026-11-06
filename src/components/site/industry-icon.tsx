import {
  Briefcase,
  ChefHat,
  GraduationCap,
  HardHat,
  Siren,
  Sparkles,
  Stethoscope,
  Truck,
  Wrench,
  Shirt,
} from "lucide-react";

const icons = {
  "hard-hat": HardHat,
  truck: Truck,
  stethoscope: Stethoscope,
  siren: Siren,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  "chef-hat": ChefHat,
  sparkles: Sparkles,
  wrench: Wrench,
};

export function IndustryIcon({
  name,
  className = "size-6",
}: {
  name: string | null;
  className?: string;
}) {
  const Icon = (name && icons[name as keyof typeof icons]) || Shirt;
  return <Icon className={className} aria-hidden />;
}
