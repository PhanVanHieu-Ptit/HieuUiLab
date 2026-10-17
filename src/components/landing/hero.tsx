import { ArrowRight, Briefcase } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'

export function LandingHero() {
  return (
    <section aria-labelledby="hero-title" className="max-w-3xl motion-safe:animate-fade-in">
      <p className="mb-4 font-mono text-xs font-medium text-primary">
        Personal frontend engineering lab
      </p>
      <h1 id="hero-title" className="text-title text-balance sm:text-display">
        Build. Learn. Share.
      </h1>
      <p className="mt-5 max-w-prose text-lg text-pretty text-muted-foreground">
        {siteConfig.name} is where I build reusable interfaces, engineer the systems around them,
        and write down what I learn along the way. Every component, block, template, and experiment
        here runs in the page, with its source, its tests, and an honest status label.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link to="/components">
            Explore Components
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/projects">
            <Briefcase aria-hidden="true" />
            View Projects
          </Link>
        </Button>
      </div>
    </section>
  )
}
