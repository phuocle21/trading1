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
          The Only Tool You Need<br />to Become Profitable
        </h1>
        <p className="text-lg md:text-xl mb-8 text-muted-foreground max-w-3xl mx-auto">
          Trade Insights helps you discover your strengths and weaknesses to become a profitable trader with the power of journaling and analytics.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button asChild size="lg" className="text-md">
            <Link href="/dashboard">Get Started Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-md">
            <Link href="/features">Learn More</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Powerful Features for Traders</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<BarChart3 className="w-10 h-10 text-primary" />}
            title="Analytics"
            description="Gain deep insights with over 50+ reports to visualize your trading performance."
          />
          <FeatureCard 
            icon={<BookOpen className="w-10 h-10 text-primary" />}
            title="Journaling"
            description="Automatically track and journal your trades to identify patterns and improve."
          />
          <FeatureCard 
            icon={<LineChart className="w-10 h-10 text-primary" />}
            title="Reporting"
            description="Get comprehensive reports on your trading activity and performance metrics."
          />
          <FeatureCard 
            icon={<AreaChart className="w-10 h-10 text-primary" />}
            title="Backtesting"
            description="Test your strategies against historical data to validate your approach."
          />
          <FeatureCard 
            icon={<RefreshCcw className="w-10 h-10 text-primary" />}
            title="Replay"
            description="Replay your trades to understand what went right and what went wrong."
          />
          <FeatureCard 
            icon={<PlayCircle className="w-10 h-10 text-primary" />}
            title="Playbooks"
            description="Create trading playbooks to document and track your strategic approach."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-primary/5 to-primary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-center">
            <div className="w-full md:w-1/3 px-4 mb-8 md:mb-0">
              <h3 className="text-4xl font-bold text-primary mb-2">20B+</h3>
              <p className="text-lg text-muted-foreground">Trades Journaled</p>
            </div>
            <div className="w-full md:w-1/3 px-4 mb-8 md:mb-0">
              <h3 className="text-4xl font-bold text-primary mb-2">100K+</h3>
              <p className="text-lg text-muted-foreground">Backtested Sessions</p>
            </div>
            <div className="w-full md:w-1/3 px-4">
              <h3 className="text-4xl font-bold text-primary mb-2">30K+</h3>
              <p className="text-lg text-muted-foreground">Traders on board</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to become a profitable trader?</h2>
        <p className="text-lg mb-8 text-muted-foreground max-w-2xl mx-auto">
          The one tool that lets you do everything you need to improve your trading strategy. Get started today.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">Get Started Today</Link>
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
