// Language detection and translations remain the same
function detectLanguage() {
  const html = document.documentElement;
  return html.lang || 'en-US';
}
// Update the calculatePaperbackRoyalty function
function calculatePaperbackRoyalty(pages, price, marketplace) {
  console.log('Calculating royalty for:', { pages, price, marketplace });

  // Define fixed costs and per-page costs for each marketplace
  const costs = {
    'en-us': { fixedCost: 1.00, perPageCost: 0.012, currency: 'USD' },
    'en-uk': { fixedCost: 0.85, perPageCost: 0.010, currency: 'GBP' },
    'de-de': { fixedCost: 0.75, perPageCost: 0.012, currency: 'EUR' },
    'ca-ca': { fixedCost: 1.26, perPageCost: 0.016, currency: 'CAD' },
    'fr-fr': { fixedCost: 0.75, perPageCost: 0.012, currency: 'EUR' },
    'es-es': { fixedCost: 0.75, perPageCost: 0.012, currency: 'EUR' },
    'it-it': { fixedCost: 0.75, perPageCost: 0.012, currency: 'EUR' },
    'jp-jp': { fixedCost: 206, perPageCost: 2, currency: 'JPY' }
  };

  // Check if the marketplace is supported
  if (!costs[marketplace]) {
    console.log('Unsupported marketplace:', marketplace);
    return { error: `Unsupported marketplace: ${marketplace}` };
  }

  const { fixedCost, perPageCost, currency } = costs[marketplace];

  // Validate inputs
  if (isNaN(pages) || isNaN(price) || pages <= 0 || price <= 0) {
    console.log('Invalid input:', { pages, price });
    return { error: 'Invalid input: pages and price must be positive numbers' };
  }

  // Calculate printing cost
  let printingCost;
  if (pages <= 108) {
    printingCost = fixedCost;
  } else {
    printingCost = fixedCost + (pages * perPageCost);
  }

  // Calculate minimum list price
  const minListPrice = printingCost / 0.6;

  // Check if the provided price is below the minimum list price
  if (price < minListPrice) {
    return {
      royalty: 0,
      currency: currency,
      printingCost: printingCost.toFixed(2),
      minListPrice: minListPrice.toFixed(2)
    };
  }

  // Calculate royalty (60% of list price minus printing costs)
  const royalty = (price * 0.6) - printingCost;

  console.log('Calculation result:', { royalty, currency, printingCost, minListPrice });

  return {
    royalty: royalty.toFixed(2),
    currency: currency,
    printingCost: printingCost.toFixed(2),
    minListPrice: minListPrice.toFixed(2)
  };
}

function getTranslations(lang) {
  const translations = {
    'en': {
      publisher: ['Publisher', 'Published by'],
      bestSellersRank: ['Best Sellers Rank', 'Amazon Best Sellers Rank'],
      inBooks: ['in Books'],
      reviews: ['customer reviews', 'ratings'],
      pages : ['pages'],
      dimensions : ['dimensions']
    },
    'de': {
      publisher: ['Verlag', 'Herausgeber'],
      bestSellersRank: ['Amazon Bestseller-Rang', 'Bestseller-Rang'],
      inBooks: ['in Bücher'],
      reviews: ['Kundenrezensionen', 'Sterne'],
      pages : ['Seiten'],
      dimensions : ['Abmessungen']

    },
    'fr': {
      publisher: ['Éditeur', 'Editeur'],
      bestSellersRank: ['Classement des meilleures ventes d\'Amazon', 'Classement des meilleures ventes'],
      inBooks: ['en Livres'],
      reviews: ['Commentaires client', 'Evaluations'],
      pages : ['pages'],
      dimensions : ['dimensions']


    },
    'es': {
      publisher: ['Editorial', 'Editora'],
      bestSellersRank: ['Clasificación en los más vendidos de Amazon', 'Clasificación en Libros'],
      inBooks: ['en Libros'],
      reviews: ['opiniones de clientes', 'valoraciones'],
      pages : ['paginas'],
      dimensions : ['dimensiones']


    },
    'it': {
      publisher: ['Editore'],
      bestSellersRank: ['Posizione nella classifica Bestseller di Amazon', 'Posizione nella Classifica Bestseller'],
      inBooks: ['in Libri'],
      reviews: ['recensioni clienti', 'voti'],
      pages : ['pagine'],
      dimensions : ['dimensioni']


    },
    'ja': {
      publisher: ['出版社'],
      bestSellersRank: ['Amazon 売れ筋ランキング', '売れ筋ランキング'],
      inBooks: ['本'],
      reviews: ['カスタマーレビュー', '個の評価'],
      pages : ['pages, pagine, Seiten, paginas'],
      dimensions : ['寸法']


    }
  };
  return translations[lang.split('-')[0]] || translations['en'];
}


function createAndInsertLoadingBar() {
  const loadingBar = document.createElement('div');
  loadingBar.id = 'product-info-loading';
  loadingBar.innerHTML = `
    <div class="loading-bar">
      <div class="loading-progress"></div>
    </div>
    <p>Extracting product information...</p>
  `;
  
  // Insert the loading bar in the correct position
  const insertLoadingBar = () => {
    const dpContainer = document.getElementById('dp-container') || document.getElementById('ppd');
    if (dpContainer) {
      dpContainer.parentNode.insertBefore(loadingBar, dpContainer);
      console.log('Loading bar inserted.');
    } else {
      console.log('Could not find a suitable container for the loading bar. Retrying...');
      setTimeout(insertLoadingBar, 100);
    }
  };
  
  insertLoadingBar();
  return loadingBar;
}

// Product details extraction functions
function getProductDetails() {
  const lang = detectLanguage();
  const t = getTranslations(lang);
  console.log('Detected language:', lang);
  const asin = document.querySelector('input[name="ASIN"]')?.value || 'N/A';
  console.log('ASIN:', asin);

  let bestSellerRanks = [];
  let publisher = 'N/A';
  let publishDate = 'N/A';
  let dimensions = 'N/A';
  let pages = 'N/A';
  let reviews = 'N/A';
  let price = 'N/A';
  let format = 'N/A';

  const detailElements = document.querySelectorAll('#detailBulletsWrapper_feature_div li, #detailBullets_feature_div li, #productDetails_detailBullets_sections1 tr, #productDetails_db_sections tr, .detail-bullet-list li');
  console.log('Number of potential detail elements found:', detailElements.length);

  detailElements.forEach((el, index) => {
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    console.log(`Checking detail element ${index}:`, text);

  // Improved price extraction
  const priceElement = document.querySelector('.a-price .a-offscreen, #price, .a-price');
  if (priceElement) {
    const priceText = priceElement.textContent.trim();
    const priceMatch = priceText.match(/[\d,.]+/);
    if (priceMatch) {
      const priceString = priceMatch[0];
      // Check if the price uses a comma as decimal separator
      if (priceString.includes(',')) {
        // Replace comma with dot and remove any thousand separators
        price = parseFloat(priceString.replace(/\./g, '').replace(',', '.'));
      } else {
        // Assume period is used as decimal separator
        price = parseFloat(priceString);
      }
    }
  }

  // Improve format extraction
  const formatElement = document.querySelector('#productSubtitle, #binding');
  if (formatElement) {
    format = formatElement.textContent.trim();
  }
    
    // Check for Best Sellers Rank
    const bestSellersRankTerms = Array.isArray(t.bestSellersRank) ? t.bestSellersRank : [t.bestSellersRank];
    if (bestSellersRankTerms.some(term => text.toLowerCase().includes(term.toLowerCase()))) {
      bestSellerRanks = extractBestSellerRanks(text);
      console.log('Best Seller Rank found:', bestSellerRanks);
    }
    
    // Check for Publisher and Publication Date
    const publisherTerms = Array.isArray(t.publisher) ? t.publisher : [t.publisher];
    if (publisherTerms.some(term => text.toLowerCase().includes(term.toLowerCase()))) {
      const colonIndex = text.indexOf(':');
      if (colonIndex !== -1) {
        const publisherInfo = text.slice(colonIndex + 1).trim();
        const publisherData = extractPublisherInfo(publisherInfo);
        publisher = cleanText(publisherData.publisher);
        publishDate = cleanText(publisherData.publishDate);
      } else {
        const publisherData = extractPublisherInfo(text);
        publisher = cleanText(publisherData.publisher);
        publishDate = cleanText(publisherData.publishDate);
      }
      console.log('Publisher:', publisher);
      console.log('Publication Date:', publishDate);
    }

    // Check for Dimensions
    if (text.toLowerCase().includes(t.dimensions)) {
      const colonIndex = text.indexOf(':');
      if (colonIndex !== -1) {
        dimensions = cleanDimensions(text.slice(colonIndex + 1).trim());
        console.log('Dimensions found:', dimensions);
      }
    }

    // Check for Pages
    if (text.toLowerCase().includes(t.pages)) {
      const pageMatch = text.match(/\d+/);
      if (pageMatch) {
        pages = pageMatch[0];
        console.log('Pages found:', pages);
      }
    }
  });
    // Fallback page extraction if not found in detail elements
    if (pages === 'N/A') {
      const pageElement = document.querySelector('.a-section .a-row');
      if (pageElement) {
        const pageMatch = pageElement.textContent.match(/(\d+)\s*(?:pages|pagine|Seiten|páginas)/i);
        if (pageMatch) {
          pages = pageMatch[1];
          console.log('Pages found (fallback):', pages);
        }
      }
    }

  // Extract reviews
  reviews = extractReviews();
  console.log('Reviews:', reviews);

  console.log('Finished extracting product details.');

  return { asin, bestSellerRanks, publisher, publishDate, dimensions, pages, reviews, price, format};
}

function cleanText(text) {
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  // Remove special characters and extra whitespace
  text = text.replace(/[^\w\s-]/g, '').trim();
  return text;
}
function cleanDimensions(text) {
  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '');
  // Keep numbers, decimal points, x, and units (cm, mm, inches, etc.)
  text = text.replace(/[^0-9.,x×\s\p{L}]/gu, '').trim();
  // Ensure there's a space before units
  text = text.replace(/(\d)([a-zA-Z])/g, '$1 $2');
  return text;
}

function extractPublisherInfo(text) {
  const publisherRegex = /^([^(]+?)(?:\s*\(([^)]+)\))?$/;
  const match = text.trim().match(publisherRegex);
  
  if (match) {
    return {
      publisher: match[1].trim(),
      publishDate: match[2] ? match[2].trim() : 'N/A'
    };
  }
  
  return {
    publisher: text.trim(),
    publishDate: 'N/A'
  };
}

function extractPublisherInfo(text) {
  const publisherRegex = /([^(]+)\s*\(([^)]+)\)/;
  const match = text.match(publisherRegex);
  
  if (match) {
    return {
      publisher: match[1].trim(),
      publishDate: match[2].trim()
    };
  }
  
  return {
    publisher: text,
    publishDate: 'N/A'
  };
}
//Extract BSR
function extractBestSellerRanks(text) {
  const rankRegex = /(?:n\.\s*([\d,.]+)|#([\d,.]+))/i;
  const match = text.match(rankRegex);

  if (match) {
    const rank = match[1] || match[2];
    console.log('Extracted rank:', rank);
    return rank;  // Return the rank as a string with original formatting
  }

  console.log('No rank extracted');
  return null;
}


function extractReviews() {
  const reviewsElement = document.querySelector('#acrCustomerReviewText');
  const ratingElement = document.querySelector('.a-icon-star');

  if (!reviewsElement || !ratingElement) {
    console.log('Reviews or rating element not found');
    return null;
  }

  const totalReviews = parseInt(reviewsElement.textContent.replace(/[^\d]/g, ''));
  const averageRating = parseFloat(ratingElement.textContent.split(' ')[0]);

  if (isNaN(totalReviews) || isNaN(averageRating)) {
    console.log('Failed to parse reviews or rating');
    return null;
  }

  return {
    totalReviews,
    averageRating: averageRating.toFixed(1)
  };
}

// Display functions
function createInfoBox(label, value) {
  const box = document.createElement('div');
  box.className = 'product-info-card';
  let content = '';

  if (label === 'BSR') {
    content = `
      <h3>${label}</h3>
      <div>${value || 'N/A'}</div>
    `;
  } else if (label === 'Reviews' && typeof value === 'object' && value !== null) {
    content = `
      <h3>${label}</h3>
      <p>Total Reviews: ${value.totalReviews}</p>
      <p>Average Rating: ${value.averageRating}</p>
    `;
  } else if (label === 'Estimated Royalty' && typeof value === 'object' && value !== null) {
    if (value.error) {
      content = `
        <h3>${label}</h3>
        <p>Error: ${value.error}</p>
      `;
    } else {
      content = `
        <h3>${label}</h3>
        <p>Royalty: ${value.royalty} ${value.currency}</p>
        <p>Printing Cost: ${value.printingCost} ${value.currency}</p>
      `;
    }
  } else {
    content = `
      <h3>${label}</h3>
      <p>${value}</p>
    `;
  }
  box.innerHTML = content;
  return box;
}

function displayProductInfo(details) {
  console.log('Displaying product info...');
  const infoContainer = document.createElement('div');
  infoContainer.id = 'lsp-amazon-tools';

  const header = document.createElement('div');
  header.className = 'lsp-header';

  const logo = document.createElement('img');
  logo.src = 'https://keyworkhelper.vercel.app/favicon.png'; // Replace with your actual logo URL
  logo.alt = 'LSP Logo';
  logo.className = 'lsp-logo';

  const title = document.createElement('blockquote');
  title.className = 'lsp-title';
  title.innerHTML = `
  <div class="boxtitle">
    <div class="tit">Product</div>
    <span class="lsp-title-highlight">
      <span class="lsp-title-highlight-text">Magnify</span>
    </span>
    </div>
  `;

  header.appendChild(logo);
  header.appendChild(title);

  infoContainer.appendChild(header);


  const infoGrid = document.createElement('div');
  infoGrid.className = 'product-info-grid';

  infoGrid.appendChild(createInfoBox('ASIN', details.asin));
  if (details.bestSellerRanks.length > 0) {
    infoGrid.appendChild(createInfoBox('BSR', details.bestSellerRanks));
  }
  if (details.publisher !== 'N/A') {
  infoGrid.appendChild(createInfoBox('Publisher', details.publisher));
  }
  if (details.publishDate !== 'N/A') {
  infoGrid.appendChild(createInfoBox('Publication Date', details.publishDate));
  }
  // if (details.dimensions !== 'N/A') {
  //   infoGrid.appendChild(createInfoBox('Dimensions', details.dimensions));
  // }
  if (details.pages !== 'N/A') {
    infoGrid.appendChild(createInfoBox('Pages', details.pages));
  }
  if (details.reviews && details.reviews.totalReviews > 0) {
    infoGrid.appendChild(createInfoBox('Reviews', details.reviews));
  }

  // Add royalty calculation
  if (details.price !== 'N/A' && details.pages !== 'N/A' && 
    (details.format.toLowerCase().includes('paperback') || 
     details.format.toLowerCase().includes('flessibile') ||
     details.format.toLowerCase().includes('broché') ||
     details.format.toLowerCase().includes('tapa blanda')) &&
    details.publisher.toLowerCase() === 'independently published') {
  const marketplace = window.location.hostname.split('.').slice(-2)[0];
  const pages = parseInt(details.pages);
  const price = parseFloat(details.price);
  console.log('Royalty calculation inputs:', { pages, price, marketplace });
  const royaltyInfo = calculatePaperbackRoyalty(pages, price, detectLanguage());
  infoGrid.appendChild(createInfoBox('Estimated Royalty', royaltyInfo));
} else {
  console.log('Skipping royalty calculation:', { 
    price: details.price, 
    pages: details.pages, 
    format: details.format,
    publisher: details.publisher
  });
}
  infoContainer.appendChild(infoGrid);

  // Replace the loading bar with the product info
  const loadingBar = document.getElementById('product-info-loading');
  if (loadingBar && loadingBar.parentNode) {
    loadingBar.parentNode.replaceChild(infoContainer, loadingBar);
    console.log('Product info container inserted, loading bar removed.');
  } else {
    console.log('Loading bar not found. Inserting product info at the default location.');
    const dpContainer = document.getElementById('dp-container') || document.getElementById('ppd');
    if (dpContainer) {
      dpContainer.parentNode.insertBefore(infoContainer, dpContainer);
    } else {
      document.body.insertAdjacentElement('afterbegin', infoContainer);
    }
  }
}

// Main execution
function init() {
  console.log('Initializing Amazon Product Enhancer...');
  
  // Use MutationObserver to detect when the product details are loaded
  const targetNode = document.body;
  const config = { childList: true, subtree: true };
  
  const callback = function(mutationsList, observer) {
    for(let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        const dpContainer = document.getElementById('dp-container') || document.getElementById('ppd');
        if (dpContainer) {
          observer.disconnect();
          // Insert loading bar and wait before extracting details
          createAndInsertLoadingBar();
          setTimeout(() => {
            const details = getProductDetails();
            displayProductInfo(details);
          }, 1500); // 1.5 second delay to ensure loading bar is visible
          return;
        }
      }
    }
  };
  
  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

// Start the script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('Content script loaded and initialized.');