import React, { useEffect, useState } from 'react';

type SeasonalEffect = 'halloween' | 'christmas' | null;

const TIME_ZONE = 'America/Bogota';

const getBogotaDateParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
  return { year: value('year'), month: value('month'), day: value('day'), hour: value('hour'), minute: value('minute'), second: value('second') };
};

const getSeason = (date: Date): SeasonalEffect => {
  const { month } = getBogotaDateParts(date);
  if (month === 10) return 'halloween';
  if (month === 12) return 'christmas';
  return null;
};

const millisecondsUntilBogotaMidnight = (date: Date) => {
  const { year, month, day, hour, minute, second } = getBogotaDateParts(date);
  const localClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const utcOffset = localClockAsUtc - date.getTime();
  const nextLocalMidnightAsUtc = Date.UTC(year, month - 1, day + 1);
  return Math.max(250, nextLocalMidnightAsUtc - utcOffset - date.getTime() + 50);
};

const halloweenDecorations = [
  { symbol: '🦇', left: '5%', top: '18%', delay: '-3s', size: '1.2rem' },
  { symbol: '✦', left: '91%', top: '24%', delay: '-1s', size: '1rem' },
  { symbol: '🎃', left: '3%', top: '65%', delay: '-5s', size: '1.35rem' },
  { symbol: '🦇', left: '94%', top: '58%', delay: '-2s', size: '1.1rem' },
  { symbol: '✧', left: '8%', top: '42%', delay: '-4s', size: '1rem' },
  { symbol: '🎃', left: '91%', top: '82%', delay: '-6s', size: '1.2rem' },
  { symbol: '👻', left: '16%', top: '34%', delay: '-7s', size: '1.4rem' },
  { symbol: '👻', left: '83%', top: '73%', delay: '-2.5s', size: '1.25rem' },
];

const christmasSnow = [
  { left: '4%', delay: '-1s', duration: '13s', size: '0.8rem' },
  { left: '12%', delay: '-8s', duration: '17s', size: '1rem' },
  { left: '21%', delay: '-4s', duration: '15s', size: '0.7rem' },
  { left: '31%', delay: '-12s', duration: '19s', size: '0.9rem' },
  { left: '42%', delay: '-6s', duration: '14s', size: '0.65rem' },
  { left: '52%', delay: '-3s', duration: '18s', size: '0.9rem' },
  { left: '63%', delay: '-10s', duration: '16s', size: '0.7rem' },
  { left: '74%', delay: '-5s', duration: '20s', size: '1rem' },
  { left: '84%', delay: '-14s', duration: '15s', size: '0.7rem' },
  { left: '95%', delay: '-7s', duration: '18s', size: '0.85rem' },
];

export const SeasonalEffects: React.FC = () => {
  const [season, setSeason] = useState<SeasonalEffect>(() => getSeason(new Date()));

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>;
    const updateAtBogotaMidnight = () => {
      const currentSeason = getSeason(new Date());
      setSeason(currentSeason);
      if (currentSeason) document.documentElement.dataset.season = currentSeason;
      else delete document.documentElement.dataset.season;
      midnightTimer = setTimeout(updateAtBogotaMidnight, millisecondsUntilBogotaMidnight(new Date()));
    };

    updateAtBogotaMidnight();
    return () => clearTimeout(midnightTimer);
  }, []);

  if (!season) return null;

  return (
    <div className={`seasonal-effects seasonal-effects--${season}`} aria-hidden="true">
      {season === 'halloween' && <>
        <span className="seasonal-effects__halloween-mist seasonal-effects__halloween-mist--left" />
        <span className="seasonal-effects__halloween-mist seasonal-effects__halloween-mist--right" />
        {halloweenDecorations.map((decoration, index) => (
          <span
            key={`halloween-${index}`}
            className={`seasonal-effects__halloween-item${decoration.symbol === '👻' ? ' seasonal-effects__ghost' : ''}`}
            style={{ left: decoration.left, top: decoration.top, animationDelay: decoration.delay, fontSize: decoration.size }}
          >
            {decoration.symbol}
          </span>
        ))}
      </>}
      {season === 'christmas' && christmasSnow.map((flake, index) => (
        <span
          key={`snow-${index}`}
          className="seasonal-effects__snowflake"
          style={{ left: flake.left, animationDelay: flake.delay, animationDuration: flake.duration, fontSize: flake.size }}
        >
          ❄
        </span>
      ))}
    </div>
  );
};
