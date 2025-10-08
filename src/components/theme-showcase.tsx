/**
 * Theme Showcase Component
 * 
 * This component demonstrates the application's theme system including:
 * - Color palette (primary, secondary, accent)
 * - Typography (DM Sans, Space Mono)
 * - Shadow system (neobrutalist hard shadows)
 * - Light/Dark mode variations
 * 
 * Purpose: Serves as a visual reference for developers and designers
 * to see all theme elements in one place.
 * 
 * Dependencies:
 * - Theme system defined in src/app/globals.css
 * - shadcn/ui components (Button, Card, Badge)
 * - Font configuration in src/app/layout.tsx
 * 
 * @component
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ThemeShowcase() {
  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="font-sans text-4xl font-bold text-foreground">
          Shop4me Theme Showcase
        </h1>
        <p className="font-sans text-lg text-muted-foreground">
          A comprehensive demonstration of the application&apos;s design system
        </p>
      </div>

      {/* Typography Section */}
      <Card className="border-2 border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Typography</CardTitle>
          <CardDescription>DM Sans & Space Mono font families</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-sans text-sm text-muted-foreground mb-2">Body Text (DM Sans)</p>
            <p className="font-sans text-base">
              The quick brown fox jumps over the lazy dog. 0123456789
            </p>
          </div>
          <div>
            <p className="font-sans text-sm text-muted-foreground mb-2">Bold Text</p>
            <p className="font-sans text-base font-bold">
              The quick brown fox jumps over the lazy dog. 0123456789
            </p>
          </div>
          <div>
            <p className="font-sans text-sm text-muted-foreground mb-2">Monospace (Space Mono)</p>
            <code className="font-mono text-base bg-muted p-2 block">
              const API_KEY = &quot;your-api-key-here&quot;;
            </code>
          </div>
          <div className="space-y-2">
            <h1 className="font-sans text-4xl font-bold">Heading 1</h1>
            <h2 className="font-sans text-3xl font-bold">Heading 2</h2>
            <h3 className="font-sans text-2xl font-bold">Heading 3</h3>
            <h4 className="font-sans text-xl font-bold">Heading 4</h4>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Section */}
      <Card className="border-2 border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Color Palette</CardTitle>
          <CardDescription>Primary, Secondary, and Accent colors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary */}
            <div className="space-y-3">
              <h4 className="font-sans font-bold text-sm">Primary (Red)</h4>
              <div className="bg-primary h-24 border-2 border-border shadow" />
              <p className="font-mono text-xs">rgb(255, 51, 51)</p>
              <Button className="w-full">Primary Button</Button>
            </div>

            {/* Secondary */}
            <div className="space-y-3">
              <h4 className="font-sans font-bold text-sm">Secondary (Yellow)</h4>
              <div className="bg-secondary h-24 border-2 border-border shadow" />
              <p className="font-mono text-xs">rgb(255, 255, 0)</p>
              <Button variant="secondary" className="w-full">Secondary Button</Button>
            </div>

            {/* Accent */}
            <div className="space-y-3">
              <h4 className="font-sans font-bold text-sm">Accent (Blue)</h4>
              <div className="bg-accent h-24 border-2 border-border shadow" />
              <p className="font-mono text-xs">rgb(0, 102, 255)</p>
              <Button 
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Accent Button
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shadows Section */}
      <Card className="border-2 border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Shadow System</CardTitle>
          <CardDescription>Neobrutalist hard shadows without blur</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <p className="font-sans text-sm font-medium">Small</p>
              <div className="bg-card h-20 border-2 border-border shadow-sm p-4">
                <p className="font-mono text-xs">shadow-sm</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-sans text-sm font-medium">Default</p>
              <div className="bg-card h-20 border-2 border-border shadow p-4">
                <p className="font-mono text-xs">shadow</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-sans text-sm font-medium">Large</p>
              <div className="bg-card h-20 border-2 border-border shadow-lg p-4">
                <p className="font-mono text-xs">shadow-lg</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-sans text-sm font-medium">Extra Large</p>
              <div className="bg-card h-20 border-2 border-border shadow-xl p-4">
                <p className="font-mono text-xs">shadow-xl</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card className="border-2 border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Badges & Labels</CardTitle>
          <CardDescription>Status indicators and tags</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge className="bg-accent text-accent-foreground border-transparent">Accent</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Neutral Colors Section */}
      <Card className="border-2 border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Neutral Colors</CardTitle>
          <CardDescription>Backgrounds, borders, and muted elements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="font-sans text-sm font-medium">Background</p>
              <div className="bg-background h-16 border-2 border-border shadow" />
              <p className="font-mono text-xs">background</p>
            </div>
            <div className="space-y-2">
              <p className="font-sans text-sm font-medium">Card</p>
              <div className="bg-card h-16 border-2 border-border shadow" />
              <p className="font-mono text-xs">card</p>
            </div>
            <div className="space-y-2">
              <p className="font-sans text-sm font-medium">Muted</p>
              <div className="bg-muted h-16 border-2 border-border shadow" />
              <p className="font-mono text-xs">muted</p>
            </div>
            <div className="space-y-2">
              <p className="font-sans text-sm font-medium">Border</p>
              <div className="bg-background h-16 border-4 border-border shadow" />
              <p className="font-mono text-xs">border</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Variants */}
      <Card className="border-2 border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Button Variants</CardTitle>
          <CardDescription>Interactive elements with different states</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </CardContent>
      </Card>

      {/* Design Principles */}
      <Card className="border-2 border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Design Principles</CardTitle>
          <CardDescription>Key characteristics of the theme system</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 font-sans">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Neobrutalism:</strong> Hard shadows, zero border radius, bold borders</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>High Contrast:</strong> Black and white base with vibrant accent colors</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Bold Typography:</strong> DM Sans for clarity, Space Mono for technical content</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Consistent Spacing:</strong> 4px base unit for predictable layouts</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">•</span>
              <span><strong>Accessible:</strong> WCAG AAA contrast ratios for text readability</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
