import { useState, type FormEvent } from "react";
import axios from "axios";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Headphones,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  PackageCheck,
  Phone,
  Send,
  ShieldCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import heroBgImg from "../../assets/images/hero-bg.png";
import { ContactService, type ContactPayload } from "../../services/contactService";

interface ContactErrorResponse {
  message?: string;
}

const faqs = [
  {
    question: "PeakSneaker cam kết sản phẩm chính hãng như thế nào?",
    answer:
      "100% sản phẩm được nhập khẩu chính ngạch. Mỗi đôi giày đều có thông tin nguồn gốc và được hỗ trợ hoàn tiền nếu phát hiện hàng giả.",
  },
  {
    question: "Thời gian và chi phí vận chuyển là bao lâu?",
    answer:
      "Đơn nội thành thường được giao trong 24-48 giờ. Các tỉnh thành khác mất khoảng 2-4 ngày làm việc qua đơn vị vận chuyển.",
  },
  {
    question: "Tôi có thể đổi size trong bao nhiêu ngày?",
    answer:
      "PeakSneaker hỗ trợ đổi size trong 7 ngày kể từ khi nhận hàng, với điều kiện sản phẩm chưa sử dụng và còn nguyên hộp, tag.",
  },
  {
    question: "Tôi có thể thử giày trực tiếp ở đâu?",
    answer:
      "Bạn có thể ghé showroom tại Khu phố 6, Phường Linh Trung, TP. Thủ Đức để thử giày và nhận tư vấn size trực tiếp.",
  },
] as const;

const initialFormData: ContactPayload = {
  fullName: "",
  email: "",
  phoneNumber: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactPayload>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const updateField = (field: keyof ContactPayload, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.fullName.trim()
      || !formData.email.trim()
      || !formData.subject.trim()
      || !formData.message.trim()
    ) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    try {
      setIsSubmitting(true);
      await ContactService.submitContact(formData);
      setFormData(initialFormData);
      setIsSuccess(true);
      toast.success("Tin nhắn đã được gửi thành công.");
    } catch (error: unknown) {
      const message = axios.isAxiosError<ContactErrorResponse>(error)
        ? error.response?.data?.message
        : undefined;
      toast.error(message || "Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      {/* 1. HERO BANNER (Dark monochromatic studio aesthetic matching HomePage & VouchersPage) */}
      <section className="relative overflow-hidden bg-[#121316] text-white pt-12 pb-24 sm:pt-16 sm:pb-28">
        {/* Ambient atmospheric glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-zinc-800/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-zinc-700/20 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Left Content */}
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="tracking-wider uppercase">Hỗ Trợ Khách Hàng 24/7</span>
              </div>

              <h1 className="text-3xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.05]">
                CHÚNG TÔI LUÔN <br />
                SẴN SÀNG LẮNG NGHE.
              </h1>

              <p className="max-w-xl text-xs sm:text-sm leading-relaxed text-zinc-400 font-normal">
                Gửi câu hỏi về sản phẩm, đơn hàng hoặc đổi trả. Đội ngũ chuyên viên PeakSneaker sẽ phản hồi và đồng hành cùng bạn sớm nhất.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="#contact-form"
                  className="inline-flex items-center gap-2.5 bg-white px-7 py-3.5 text-xs font-black uppercase tracking-widest text-zinc-950 shadow-xl transition-colors hover:bg-zinc-200 active:translate-y-px"
                >
                  <span>Gửi lời nhắn</span>
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <a
                  href="tel:1900888666"
                  className="inline-flex items-center gap-2.5 border border-zinc-700 px-7 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-white/10 active:translate-y-px"
                >
                  <Phone className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Hotline: 1900 888 666</span>
                </a>
              </div>
            </div>

            {/* Right Sneaker Artwork */}
            <div className="relative flex justify-center lg:col-span-5 lg:justify-end">
              <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none overflow-hidden rounded-2xl shadow-2xl border border-zinc-800">
                <img
                  src={heroBgImg}
                  alt="Showroom PeakSneaker"
                  className="w-full h-auto object-cover object-center filter drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                />
                {/* Subtle gradient blend on left edge */}
                <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#121316] to-transparent hidden lg:block" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#121316]/80 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FLOATING INFO CARD (Showroom, Support Hotline, Working Hours) */}
      <div className="relative z-20 -mt-10 sm:-mt-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/80 p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:divide-x divide-zinc-200">
            {/* Item 1: Showroom */}
            <div className="flex items-start gap-4 lg:pr-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                <MapPin className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                    Showroom Trải Nghiệm
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Đón khách
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh
                </p>
              </div>
            </div>

            {/* Item 2: Tư vấn trực tiếp */}
            <div className="flex items-start gap-4 lg:px-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                <Headphones className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  Tư Vấn Trực Tiếp
                </h3>
                <a
                  href="tel:1900888666"
                  className="block text-xs font-bold text-zinc-900 hover:text-zinc-600 transition-colors"
                >
                  Hotline: 1900 888 666
                </a>
                <a
                  href="mailto:support@peaksneaker.vn"
                  className="block text-xs text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  support@peaksneaker.vn
                </a>
              </div>
            </div>

            {/* Item 3: Thời gian phục vụ */}
            <div className="flex items-start gap-4 lg:pl-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900">
                <Clock3 className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-900">
                  Thời Gian Phục Vụ
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  08:30 - 21:30 (Tất cả các ngày trong tuần)
                </p>
                <p className="text-[11px] font-medium text-emerald-600">
                  Đặt hàng trực tuyến 24/7
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTACT FORM & FAQ SECTION */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-8">
        <div id="contact-form" className="scroll-mt-28">
          {isSuccess ? (
            <div className="flex min-h-[520px] flex-col justify-center border border-zinc-200 bg-zinc-50 p-8 sm:p-12">
              <CheckCircle2 className="h-11 w-11" strokeWidth={1.5} aria-hidden="true" />
              <h2 className="mt-7 text-3xl font-black uppercase tracking-tight sm:text-4xl">
                Chúng tôi đã nhận được tin nhắn.
              </h2>
              <p className="mt-4 max-w-lg leading-7 text-zinc-600">
                Cảm ơn bạn đã liên hệ. PeakSneaker sẽ phản hồi qua email hoặc số điện thoại đã cung cấp.
              </p>
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="mt-8 w-fit border border-zinc-950 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors hover:bg-zinc-950 hover:text-white active:translate-y-px"
              >
                Gửi tin nhắn khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="border border-zinc-200 bg-zinc-50 p-6 sm:p-10">
              <div className="border-b border-zinc-200 pb-8">
                <MessageSquareText className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
                <h2 className="mt-5 text-3xl font-black uppercase tracking-tight">Gửi lời nhắn</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  Các trường có dấu * là bắt buộc.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label className="block text-sm font-bold text-zinc-800">
                  Họ và tên *
                  <input
                    type="text"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3.5 text-sm font-normal outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                    required
                  />
                </label>

                <label className="block text-sm font-bold text-zinc-800">
                  Địa chỉ email *
                  <input
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="email@example.com"
                    className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3.5 text-sm font-normal outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                    required
                  />
                </label>

                <label className="block text-sm font-bold text-zinc-800">
                  Số điện thoại
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={formData.phoneNumber || ""}
                    onChange={(event) => updateField("phoneNumber", event.target.value)}
                    placeholder="0912 345 678"
                    className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3.5 text-sm font-normal outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                  />
                </label>

                <label className="block text-sm font-bold text-zinc-800">
                  Chủ đề liên hệ *
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(event) => updateField("subject", event.target.value)}
                    placeholder="Tư vấn size, đơn hàng, bảo hành"
                    className="mt-2 w-full border border-zinc-300 bg-white px-4 py-3.5 text-sm font-normal outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                    required
                  />
                </label>
              </div>

              <label className="mt-6 block text-sm font-bold text-zinc-800">
                Nội dung tin nhắn *
                <textarea
                  rows={6}
                  value={formData.message}
                  onChange={(event) => updateField("message", event.target.value)}
                  placeholder="Mô tả câu hỏi hoặc vấn đề bạn đang gặp phải"
                  className="mt-2 w-full resize-y border border-zinc-300 bg-white px-4 py-3.5 text-sm font-normal outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-7 inline-flex w-full items-center justify-center gap-3 bg-zinc-950 px-7 py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-zinc-800 active:translate-y-px disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Đang gửi
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Gửi tin nhắn
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <aside>
          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">Câu hỏi thường gặp</h2>
          <p className="mt-4 max-w-lg leading-7 text-zinc-600">
            Thông tin nhanh về sản phẩm, giao hàng và chính sách đổi trả.
          </p>

          <div className="mt-9 border-t border-zinc-950">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <article key={faq.question} className="border-b border-zinc-200">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left text-base font-bold text-zinc-950"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>
                  {isOpen && <p className="max-w-xl pb-6 pr-8 text-sm leading-7 text-zinc-600">{faq.answer}</p>}
                </article>
              );
            })}
          </div>

          <div className="mt-12 border border-zinc-200 p-7">
            <h3 className="text-sm font-black uppercase tracking-wider">Cam kết dịch vụ</h3>
            <div className="mt-6 space-y-5">
              <div className="flex gap-4">
                <ShieldCheck className="h-6 w-6 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                <p className="text-sm leading-6 text-zinc-600">Sản phẩm chính hãng, kiểm tra nguồn gốc rõ ràng.</p>
              </div>
              <div className="flex gap-4">
                <PackageCheck className="h-6 w-6 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                <p className="text-sm leading-6 text-zinc-600">Đóng gói hai lớp để bảo vệ sản phẩm và hộp giày.</p>
              </div>
              <div className="flex gap-4">
                <Mail className="h-6 w-6 shrink-0" strokeWidth={1.6} aria-hidden="true" />
                <p className="text-sm leading-6 text-zinc-600">Mọi yêu cầu đều được lưu lại để theo dõi phản hồi.</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
