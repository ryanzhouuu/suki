-- Add rich metadata fields to the anime table for enhanced detail pages.
-- All columns are nullable so existing cached rows remain valid until resynced.

ALTER TABLE anime
  ADD COLUMN IF NOT EXISTS start_date      jsonb,
  ADD COLUMN IF NOT EXISTS end_date        jsonb,
  ADD COLUMN IF NOT EXISTS mean_score      integer,
  ADD COLUMN IF NOT EXISTS trending        integer,
  ADD COLUMN IF NOT EXISTS favourites      integer,
  ADD COLUMN IF NOT EXISTS country_of_origin text,
  ADD COLUMN IF NOT EXISTS hashtag         text,
  ADD COLUMN IF NOT EXISTS site_url        text,
  ADD COLUMN IF NOT EXISTS trailer         jsonb,
  ADD COLUMN IF NOT EXISTS studios         jsonb,
  ADD COLUMN IF NOT EXISTS tags            jsonb,
  ADD COLUMN IF NOT EXISTS rankings        jsonb,
  ADD COLUMN IF NOT EXISTS external_links  jsonb;
