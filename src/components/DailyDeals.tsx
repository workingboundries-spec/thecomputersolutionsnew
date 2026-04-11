import { useDailyDeals } from "@/hooks/use-site-data";
import { Flame, Clock } from "lucide-react";
import dealFallback from "@/assets/deal-laptop.jpg";

const DailyDeals = () => {
  const { data: deals, isLoading } = useDailyDeals();

  const activeDeals = deals?.filter(
    (d) => new Date(d.valid_until) >= new Date(new Date().toDateString())
  );

  if (isLoading || !activeDeals?.length) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const daysLeft = (dateStr: string) => {
    const diff = Math.ceil(
      (new Date(dateStr).getTime() - new Date(new Date().toDateString()).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  return (
    <section id="deals" className="py-20 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Flame className="h-7 w-7 text-destructive animate-pulse" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gradient">
            Daily Deals
          </h2>
          <Flame className="h-7 w-7 text-destructive animate-pulse" />
        </div>
        <p className="text-center text-muted-foreground mb-10">
          Grab these limited-time offers before they expire!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeDeals.map((deal) => {
            const remaining = daysLeft(deal.valid_until);
            return (
              <div
                key={deal.id}
                className="glass rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-primary/20 relative"
              >
                {/* Urgency badge */}
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full">
                  <Clock className="h-3 w-3" />
                  {remaining <= 1 ? "Last Day!" : `${remaining} days left`}
                </div>

                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  {deal.image ? (
                    <img
                      src={deal.image || dealFallback}
                      alt={deal.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      width={800}
                      height={600}
                    />
                  ) : (
                    <img
                      src={dealFallback}
                      alt={deal.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      width={800}
                      height={600}
                    />
                  )}
                </div>

                {/* Details */}
                <div className="p-5">
                  <h3 className="font-heading font-semibold text-lg mb-2 line-clamp-2">
                    {deal.name}
                  </h3>

                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-muted-foreground line-through text-sm">
                      {deal.original_price}
                    </span>
                    <span className="text-primary font-heading font-bold text-xl">
                      {deal.deal_price}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Valid till {formatDate(deal.valid_until)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DailyDeals;
