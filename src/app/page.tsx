"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { BarChart3, CheckCircle2, LineChart, BookOpen, AreaChart, RefreshCcw, PlayCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
          Công Cụ Duy Nhất Bạn Cần<br />Để Trở Nên Sinh Lợi
        </h1>
        <p className="text-lg md:text-xl mb-8 text-muted-foreground max-w-3xl mx-auto">
          Trade Insights giúp bạn khám phá điểm mạnh và điểm yếu của mình để trở thành một nhà giao dịch sinh lợi với sức mạnh của nhật ký và phân tích.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button asChild size="lg" className="text-md">
            <Link href="/dashboard">Bắt Đầu Ngay</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-md">
            <Link href="/features">Tìm Hiểu Thêm</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Tính Năng Mạnh Mẽ Cho Nhà Giao Dịch</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<BarChart3 className="w-10 h-10 text-primary" />}
            title="Phân Tích"
            description="Có được những hiểu biết sâu sắc với hơn 50+ báo cáo để trực quan hóa hiệu suất giao dịch của bạn."
          />
          <FeatureCard 
            icon={<BookOpen className="w-10 h-10 text-primary" />}
            title="Ghi Nhật Ký"
            description="Tự động theo dõi và ghi lại các giao dịch của bạn để xác định mô hình và cải thiện."
          />
          <FeatureCard 
            icon={<LineChart className="w-10 h-10 text-primary" />}
            title="Báo Cáo"
            description="Nhận báo cáo toàn diện về hoạt động giao dịch và các chỉ số hiệu suất của bạn."
          />
          <FeatureCard 
            icon={<AreaChart className="w-10 h-10 text-primary" />}
            title="Kiểm Tra Lịch Sử"
            description="Kiểm tra chiến lược của bạn dựa trên dữ liệu lịch sử để xác nhận phương pháp tiếp cận của bạn."
          />
          <FeatureCard 
            icon={<RefreshCcw className="w-10 h-10 text-primary" />}
            title="Phát Lại"
            description="Phát lại các giao dịch của bạn để hiểu điều gì đã đúng và điều gì đã sai."
          />
          <FeatureCard 
            icon={<PlayCircle className="w-10 h-10 text-primary" />}
            title="Sổ Tay Chiến Thuật"
            description="Tạo sổ tay chiến thuật giao dịch để ghi lại và theo dõi phương pháp chiến lược của bạn."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-primary/5 to-primary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-center">
            <div className="w-full md:w-1/3 px-4 mb-8 md:mb-0">
              <h3 className="text-4xl font-bold text-primary mb-2">20 Tỷ+</h3>
              <p className="text-lg text-muted-foreground">Giao Dịch Đã Ghi Nhật Ký</p>
            </div>
            <div className="w-full md:w-1/3 px-4 mb-8 md:mb-0">
              <h3 className="text-4xl font-bold text-primary mb-2">100K+</h3>
              <p className="text-lg text-muted-foreground">Phiên Kiểm Tra Lịch Sử</p>
            </div>
            <div className="w-full md:w-1/3 px-4">
              <h3 className="text-4xl font-bold text-primary mb-2">30K+</h3>
              <p className="text-lg text-muted-foreground">Nhà Giao Dịch Tham Gia</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Sẵn sàng trở thành một nhà giao dịch sinh lợi?</h2>
        <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
          Công cụ duy nhất cho phép bạn làm mọi thứ bạn cần để cải thiện chiến lược giao dịch của mình. Bắt đầu ngay hôm nay.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">Bắt Đầu Ngay Hôm Nay</Link>
        </Button>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="bg-card/50 hover:bg-card/80 transition-colors border-0 shadow-md">
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className="mb-4 p-3 rounded-full bg-primary/10">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
