"use client";

import PhoneInput from "@/components/phone-input/PhoneInput";
import { initializeInterviewData } from "@/lib/interview-storage";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handlePhoneConfirm = (phoneNumber: string) => {
    // 면접 데이터 초기화
    initializeInterviewData(phoneNumber);

    // 음성 테스트 페이지로 이동
    router.push("/mic-test");
  };

  return <PhoneInput onConfirm={handlePhoneConfirm} />;
}
