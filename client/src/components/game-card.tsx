import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Game } from "@shared/schema";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[3/4] relative overflow-hidden">
        {game.cover ? (
          <img 
            src={game.cover} 
            alt={game.title}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">No Cover</span>
          </div>
        )}
      </div>
      <CardHeader className="p-4">
        <h3 className="font-semibold truncate">{game.title}</h3>
        <p className="text-sm text-muted-foreground">{game.releaseDate}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {game.platforms?.map((platform) => (
            <Badge key={platform} variant="secondary">
              {platform}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
