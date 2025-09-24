"use client";

import { PhoneInput } from "@/components/phone-input";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handlePhoneConfirm = (phoneNumber: string) => {
    // 음성 테스트 페이지로 이동
    router.push("/mic-test");
  };

  return <PhoneInput onConfirm={handlePhoneConfirm} />;
}
