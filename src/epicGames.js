// ==========================================================
// epicGames.js — Epic Free Games Bot
// Copyright (c) 2026 Nexoz
// All Rights Reserved.
//
// Unauthorized copying, modification, distribution,
// or commercial use of this software is prohibited.
// ==========================================================

const axios = require('axios');

const EGS_API_URL =
  'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions';

/**
 * @param {string} locale
 * @param {string} country
 * @returns {{ currentGames: Game[], nextGames: Game[] }}
 */
async function fetchFreeGames(locale = 'en-US', country = 'US') {
  const response = await axios.get(EGS_API_URL, {
    params: { locale, country, allowCountries: country },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 15_000,
  });

  const elements =
    response.data?.data?.Catalog?.searchStore?.elements ?? [];

  const currentGames = [];
  const nextGames = [];

  for (const game of elements) {
    const promotions = game.promotions;

    if (!promotions) continue;

    const originalPrice =
      game.price?.totalPrice?.originalPrice ?? null;

    if (originalPrice === 0 && !hasActiveLimitedOffer(game)) continue;

    const activeOffers = promotions.promotionalOffers ?? [];
    for (const offerGroup of activeOffers) {
      for (const offer of offerGroup.promotionalOffers ?? []) {
        if (offer.discountSetting?.discountPercentage === 0) {
          currentGames.push(buildGameObject(game, offer));
        }
      }
    }

    const upcomingOffers = promotions.upcomingPromotionalOffers ?? [];
    for (const offerGroup of upcomingOffers) {
      for (const offer of offerGroup.promotionalOffers ?? []) {
        if (offer.discountSetting?.discountPercentage === 0) {
          nextGames.push(buildGameObject(game, offer));
        }
      }
    }
  }

  return { currentGames, nextGames };
}

/**
 * @param {object} game
 * @returns {boolean}
 */
function hasActiveLimitedOffer(game) {
  const promo = game.promotions;
  if (!promo) return false;
  const allGroups = [
    ...(promo.promotionalOffers ?? []),
    ...(promo.upcomingPromotionalOffers ?? []),
  ];
  for (const group of allGroups) {
    if ((group.promotionalOffers ?? []).length > 0) return true;
  }
  return false;
}

/**
 * @param {object} game
 * @param {object} offer
 * @returns {Game}
 */
function buildGameObject(game, offer) {
  const images = game.keyImages ?? [];
  const coverImage =
    findImage(images, 'OfferImageWide') ??
    findImage(images, 'Thumbnail') ??
    findImage(images, 'DieselStoreFrontWide') ??
    findImage(images, 'DieselGameBoxWide') ??
    images[0]?.url ??
    null;

  const slug =
    game.productSlug?.replace(/\/home$/, '') ??
    game.offerMappings?.[0]?.pageSlug ??
    game.urlSlug ??
    null;

  const storeUrl = slug
    ? `https://store.epicgames.com/en-US/p/${slug}`
    : 'https://store.epicgames.com/en-US/free-games';

  const priceCents = game.price?.totalPrice?.originalPrice ?? 0;
  const formattedPrice =
    priceCents > 0
      ? `$${(priceCents / 100).toFixed(2)}`
      : 'Free';

  return {
    title: game.title ?? 'Unknown Title',
    description: game.description ?? '',
    coverImage,
    storeUrl,
    originalPrice: formattedPrice,
    seller: game.seller?.name ?? 'Unknown',
    startDate: offer.startDate ? new Date(offer.startDate) : null,
    endDate: offer.endDate ? new Date(offer.endDate) : null,
  };
}

/**
 * @param {Array} images
 * @param {string} type
 * @returns {string|null}
 */
function findImage(images, type) {
  const img = images.find((i) => i.type === type);
  return img?.url ?? null;
}

module.exports = { fetchFreeGames };
