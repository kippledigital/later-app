// Knowledge processing pipeline - Transform content into structured knowledge
class KnowledgeProcessor {
  constructor() {
    this.processors = {
      content: new ContentAnalyzer(),
      entities: new EntityExtractor(),
      concepts: new ConceptMapper(),
      relationships: new RelationshipDetector(),
      summarizer: new IntelligentSummarizer()
    };

    this.knowledgeGraph = new Map(); // Store relationships between items
    this.conceptIndex = new Map(); // Index items by concepts
    this.entityIndex = new Map(); // Index items by entities
  }

  init() {
    this.setupEventListeners();
    this.loadKnowledgeGraph();
  }

  setupEventListeners() {
    // Process new items as they're saved
    document.addEventListener('itemSaved', (e) => {
      if (e.detail && e.detail.item) {
        this.processItem(e.detail.item);
      }
    });

    // Reprocess items when content is updated
    document.addEventListener('itemUpdated', (e) => {
      if (e.detail && e.detail.item) {
        this.reprocessItem(e.detail.item);
      }
    });
  }

  // Main processing pipeline
  async processItem(item) {
    console.log('Processing knowledge for item:', item.title);

    try {
      // 1. Extract and analyze content
      const contentAnalysis = await this.processors.content.analyze(item);

      // 2. Extract entities (people, places, organizations, etc.)
      const entities = await this.processors.entities.extract(item, contentAnalysis);

      // 3. Map concepts and topics
      const concepts = await this.processors.concepts.map(item, contentAnalysis);

      // 4. Generate intelligent summary
      const summary = await this.processors.summarizer.generate(item, contentAnalysis);

      // 5. Detect relationships with existing items
      const relationships = await this.processors.relationships.detect(item, this.knowledgeGraph);

      // 6. Create knowledge metadata
      const knowledgeData = {
        processed: true,
        processedAt: new Date().toISOString(),
        contentAnalysis,
        entities,
        concepts,
        summary,
        relationships,
        keyInsights: this.extractKeyInsights(contentAnalysis, entities, concepts),
        readingLevel: this.assessReadingLevel(contentAnalysis),
        estimatedValue: this.estimateKnowledgeValue(concepts, relationships)
      };

      // 7. Update item with knowledge data
      await this.updateItemWithKnowledge(item.id, knowledgeData);

      // 8. Update knowledge graph and indexes
      this.updateKnowledgeGraph(item.id, knowledgeData);
      this.updateIndexes(item.id, knowledgeData);

      // 9. Trigger relationship notifications
      this.notifyRelationships(item, relationships);

      console.log('Knowledge processing complete for:', item.title);

    } catch (error) {
      console.error('Knowledge processing failed:', error);
    }
  }

  // Extract key insights from analysis
  extractKeyInsights(contentAnalysis, entities, concepts) {
    const insights = [];

    // Important quotes and statements
    if (contentAnalysis.quotes && contentAnalysis.quotes.length > 0) {
      insights.push({
        type: 'quote',
        content: contentAnalysis.quotes[0], // Most important quote
        confidence: 0.9
      });
    }

    // Key statistics or numbers
    if (contentAnalysis.statistics && contentAnalysis.statistics.length > 0) {
      insights.push({
        type: 'statistic',
        content: contentAnalysis.statistics[0],
        confidence: 0.8
      });
    }

    // Main argument or thesis
    if (contentAnalysis.mainArgument) {
      insights.push({
        type: 'argument',
        content: contentAnalysis.mainArgument,
        confidence: 0.85
      });
    }

    // Notable entities
    const importantEntities = entities.filter(e => e.importance > 0.7);
    if (importantEntities.length > 0) {
      insights.push({
        type: 'entity',
        content: `Key entities: ${importantEntities.map(e => e.name).join(', ')}`,
        confidence: 0.7
      });
    }

    return insights.slice(0, 3); // Top 3 insights
  }

  // Assess reading complexity
  assessReadingLevel(contentAnalysis) {
    const factors = {
      sentenceLength: contentAnalysis.avgSentenceLength || 15,
      vocabularyComplexity: contentAnalysis.vocabularyScore || 0.5,
      conceptDensity: contentAnalysis.conceptDensity || 0.5,
      technicalTerms: contentAnalysis.technicalTerms || 0
    };

    // Simple scoring algorithm
    let score = 0;
    if (factors.sentenceLength > 20) score += 0.3;
    if (factors.vocabularyComplexity > 0.7) score += 0.3;
    if (factors.conceptDensity > 0.6) score += 0.2;
    if (factors.technicalTerms > 5) score += 0.2;

    if (score < 0.3) return 'easy';
    if (score < 0.6) return 'medium';
    return 'complex';
  }

  // Estimate knowledge value
  estimateKnowledgeValue(concepts, relationships) {
    let value = 0.5; // Base value

    // Boost for unique concepts
    const uniqueConcepts = concepts.filter(c => c.uniqueness > 0.7);
    value += uniqueConcepts.length * 0.1;

    // Boost for connections to existing knowledge
    value += relationships.length * 0.05;

    // Boost for actionable insights
    const actionableConcepts = concepts.filter(c => c.actionable);
    value += actionableConcepts.length * 0.1;

    return Math.min(value, 1.0);
  }

  // Update item with knowledge data
  async updateItemWithKnowledge(itemId, knowledgeData) {
    const item = window.dataManager.getItem(itemId);
    if (!item) return;

    // Update item with knowledge metadata
    const updatedItem = {
      ...item,
      knowledge: knowledgeData,
      // Update estimated reading time based on analysis
      estimatedDuration: this.calculateReadingTime(knowledgeData.contentAnalysis),
      // Add auto-generated tags
      autoTags: this.generateAutoTags(knowledgeData),
      // Update summary if better than existing
      summary: knowledgeData.summary.text || item.summary
    };

    window.dataManager.updateItem(itemId, updatedItem);
  }

  // Calculate more accurate reading time
  calculateReadingTime(contentAnalysis) {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = contentAnalysis.wordCount || 500;

    // Adjust for complexity
    let adjustedWPM = wordsPerMinute;
    if (contentAnalysis.complexity === 'complex') adjustedWPM *= 0.7;
    if (contentAnalysis.complexity === 'easy') adjustedWPM *= 1.2;

    return Math.max(1, Math.round(wordCount / adjustedWPM));
  }

  // Generate automatic tags
  generateAutoTags(knowledgeData) {
    const tags = [];

    // Add concept-based tags
    knowledgeData.concepts.forEach(concept => {
      if (concept.confidence > 0.7) {
        tags.push(concept.name.toLowerCase());
      }
    });

    // Add entity-based tags
    knowledgeData.entities.forEach(entity => {
      if (entity.type === 'PERSON' && entity.importance > 0.8) {
        tags.push(`person:${entity.name.toLowerCase()}`);
      }
      if (entity.type === 'ORG' && entity.importance > 0.8) {
        tags.push(`org:${entity.name.toLowerCase()}`);
      }
    });

    // Add content-type tags
    if (knowledgeData.contentAnalysis.hasCode) tags.push('code');
    if (knowledgeData.contentAnalysis.hasDiagrams) tags.push('visual');
    if (knowledgeData.contentAnalysis.isHowTo) tags.push('tutorial');
    if (knowledgeData.contentAnalysis.isOpinion) tags.push('opinion');

    return tags.slice(0, 8); // Limit to 8 auto-tags
  }

  // Update knowledge graph
  updateKnowledgeGraph(itemId, knowledgeData) {
    // Store item in knowledge graph
    this.knowledgeGraph.set(itemId, {
      concepts: knowledgeData.concepts,
      entities: knowledgeData.entities,
      relationships: knowledgeData.relationships,
      lastUpdated: Date.now()
    });

    // Update relationships
    knowledgeData.relationships.forEach(rel => {
      if (!this.knowledgeGraph.has(rel.targetId)) return;

      const targetData = this.knowledgeGraph.get(rel.targetId);
      if (!targetData.relationships) targetData.relationships = [];

      // Add bidirectional relationship
      const reverseRel = {
        targetId: itemId,
        type: rel.type,
        strength: rel.strength,
        reason: rel.reason
      };

      // Avoid duplicates
      if (!targetData.relationships.find(r => r.targetId === itemId && r.type === rel.type)) {
        targetData.relationships.push(reverseRel);
      }
    });

    this.saveKnowledgeGraph();
  }

  // Update search indexes
  updateIndexes(itemId, knowledgeData) {
    // Index by concepts
    knowledgeData.concepts.forEach(concept => {
      if (!this.conceptIndex.has(concept.name)) {
        this.conceptIndex.set(concept.name, []);
      }
      this.conceptIndex.get(concept.name).push({
        itemId,
        confidence: concept.confidence,
        context: concept.context
      });
    });

    // Index by entities
    knowledgeData.entities.forEach(entity => {
      const key = `${entity.type}:${entity.name}`;
      if (!this.entityIndex.has(key)) {
        this.entityIndex.set(key, []);
      }
      this.entityIndex.get(key).push({
        itemId,
        importance: entity.importance,
        context: entity.context
      });
    });
  }

  // Notify about relationships
  notifyRelationships(item, relationships) {
    if (relationships.length === 0) return;

    // Only show notifications for strong relationships
    const strongRelationships = relationships.filter(r => r.strength > 0.7);
    if (strongRelationships.length === 0) return;

    // Show a gentle notification
    const notification = {
      type: 'knowledge-connection',
      title: 'Knowledge Connection Found',
      message: `"${item.title}" relates to ${strongRelationships.length} other item${strongRelationships.length > 1 ? 's' : ''} in your collection`,
      actions: [
        { label: 'Explore connections', action: 'show-connections' },
        { label: 'Dismiss', action: 'dismiss' }
      ],
      data: { itemId: item.id, relationships: strongRelationships }
    };

    this.showKnowledgeNotification(notification);
  }

  // Show knowledge notification
  showKnowledgeNotification(notification) {
    // Create a gentle notification that doesn't interrupt
    const notificationHTML = `
      <div id="knowledgeNotification" class="fixed top-4 right-4 z-[80] w-80 bg-slate-900/95 backdrop-blur rounded-xl ring-1 ring-white/10 p-4 shadow-2xl opacity-0 translate-x-4 transition-all duration-300">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg bg-purple-500/10 ring-1 ring-purple-500/20 flex items-center justify-center shrink-0">
            <i data-lucide="link" class="w-4 h-4 text-purple-300"></i>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-[14px] font-medium text-slate-100 mb-1">${notification.title}</h3>
            <p class="text-[12px] text-slate-400 leading-relaxed mb-3">${notification.message}</p>
            <div class="flex items-center gap-2">
              ${notification.actions.map(action => `
                <button onclick="window.knowledgeProcessor.handleNotificationAction('${action.action}', '${notification.data.itemId}')" class="text-[11px] px-2 py-1 rounded-md ${action.action === 'show-connections' ? 'bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/25' : 'bg-white/5 text-slate-400 ring-1 ring-white/10'} transition-colors">
                  ${action.label}
                </button>
              `).join('')}
            </div>
          </div>
          <button onclick="window.knowledgeProcessor.dismissNotification()" class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 ring-1 ring-white/10 transition-colors">
            <i data-lucide="x" class="w-3 h-3 text-slate-400"></i>
          </button>
        </div>
      </div>
    `;

    // Remove existing notification
    const existing = document.getElementById('knowledgeNotification');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', notificationHTML);

    // Animate in
    requestAnimationFrame(() => {
      const element = document.getElementById('knowledgeNotification');
      if (element) {
        element.style.opacity = '1';
        element.style.transform = 'translateX(0)';

        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }

        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          this.dismissNotification();
        }, 8000);
      }
    });
  }

  handleNotificationAction(action, itemId) {
    switch (action) {
      case 'show-connections':
        this.showItemConnections(itemId);
        break;
      case 'dismiss':
        this.dismissNotification();
        break;
    }
  }

  dismissNotification() {
    const notification = document.getElementById('knowledgeNotification');
    if (notification) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(16px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }

  // Show connections for an item
  showItemConnections(itemId) {
    const knowledgeData = this.knowledgeGraph.get(itemId);
    if (!knowledgeData || !knowledgeData.relationships) return;

    // For now, just show a simple modal
    // In the future, this could be a rich knowledge map view
    const item = window.dataManager.getItem(itemId);
    const connectionsText = knowledgeData.relationships
      .map(rel => {
        const targetItem = window.dataManager.getItem(rel.targetId);
        return targetItem ? `• ${targetItem.title} (${rel.type})` : '';
      })
      .filter(Boolean)
      .join('\n');

    alert(`Connections for "${item.title}":\n\n${connectionsText}`);
    this.dismissNotification();
  }

  // Search knowledge by concept
  findByConcept(conceptName) {
    const items = this.conceptIndex.get(conceptName.toLowerCase()) || [];
    return items.sort((a, b) => b.confidence - a.confidence);
  }

  // Search knowledge by entity
  findByEntity(entityType, entityName) {
    const key = `${entityType}:${entityName.toLowerCase()}`;
    const items = this.entityIndex.get(key) || [];
    return items.sort((a, b) => b.importance - a.importance);
  }

  // Get related items
  getRelatedItems(itemId, limit = 5) {
    const knowledgeData = this.knowledgeGraph.get(itemId);
    if (!knowledgeData || !knowledgeData.relationships) return [];

    return knowledgeData.relationships
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit)
      .map(rel => ({
        item: window.dataManager.getItem(rel.targetId),
        relationship: rel
      }))
      .filter(r => r.item);
  }

  // Persistence
  saveKnowledgeGraph() {
    try {
      const graphData = {
        graph: Array.from(this.knowledgeGraph.entries()),
        concepts: Array.from(this.conceptIndex.entries()),
        entities: Array.from(this.entityIndex.entries()),
        lastUpdated: Date.now()
      };
      localStorage.setItem('laterApp_knowledgeGraph', JSON.stringify(graphData));
    } catch (error) {
      console.error('Failed to save knowledge graph:', error);
    }
  }

  loadKnowledgeGraph() {
    try {
      const saved = localStorage.getItem('laterApp_knowledgeGraph');
      if (!saved) return;

      const graphData = JSON.parse(saved);
      this.knowledgeGraph = new Map(graphData.graph || []);
      this.conceptIndex = new Map(graphData.concepts || []);
      this.entityIndex = new Map(graphData.entities || []);

      console.log('Knowledge graph loaded:', this.knowledgeGraph.size, 'items');
    } catch (error) {
      console.error('Failed to load knowledge graph:', error);
    }
  }

  // Get knowledge stats
  getKnowledgeStats() {
    return {
      totalItems: this.knowledgeGraph.size,
      totalConcepts: this.conceptIndex.size,
      totalEntities: this.entityIndex.size,
      totalRelationships: Array.from(this.knowledgeGraph.values())
        .reduce((sum, data) => sum + (data.relationships?.length || 0), 0)
    };
  }
}

// Individual processor classes
class ContentAnalyzer {
  async analyze(item) {
    const text = (item.title + ' ' + (item.content || '')).toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 2);

    return {
      wordCount: words.length,
      avgSentenceLength: this.calculateAvgSentenceLength(text),
      vocabularyScore: this.calculateVocabularyComplexity(words),
      conceptDensity: this.calculateConceptDensity(text),
      technicalTerms: this.countTechnicalTerms(words),
      hasCode: text.includes('function') || text.includes('class') || text.includes('def '),
      hasDiagrams: text.includes('diagram') || text.includes('chart') || text.includes('graph'),
      isHowTo: text.includes('how to') || text.includes('tutorial') || text.includes('guide'),
      isOpinion: text.includes('i think') || text.includes('in my opinion') || text.includes('believe'),
      quotes: this.extractQuotes(item.content || ''),
      statistics: this.extractStatistics(item.content || ''),
      mainArgument: this.extractMainArgument(item.content || ''),
      complexity: 'medium' // Will be calculated later
    };
  }

  calculateAvgSentenceLength(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const totalWords = text.split(/\s+/).length;
    return sentences.length > 0 ? totalWords / sentences.length : 15;
  }

  calculateVocabularyComplexity(words) {
    const uniqueWords = new Set(words);
    const complexWords = words.filter(w => w.length > 6).length;
    return complexWords / words.length;
  }

  calculateConceptDensity(text) {
    const conceptIndicators = ['concept', 'idea', 'theory', 'principle', 'framework', 'model'];
    const matches = conceptIndicators.filter(indicator => text.includes(indicator)).length;
    return Math.min(matches / 10, 1);
  }

  countTechnicalTerms(words) {
    const techTerms = ['api', 'algorithm', 'database', 'framework', 'library', 'protocol', 'interface'];
    return words.filter(w => techTerms.includes(w)).length;
  }

  extractQuotes(content) {
    const quoteRegex = /"([^"]{10,100})"/g;
    const matches = [];
    let match;
    while ((match = quoteRegex.exec(content)) !== null && matches.length < 3) {
      matches.push(match[1]);
    }
    return matches;
  }

  extractStatistics(content) {
    const statRegex = /(\d+(?:\.\d+)?%|\d+(?:,\d{3})*|\$\d+(?:\.\d{2})?)/g;
    const matches = [];
    let match;
    while ((match = statRegex.exec(content)) !== null && matches.length < 3) {
      matches.push(match[1]);
    }
    return matches;
  }

  extractMainArgument(content) {
    // Simple heuristic: look for conclusion indicators
    const conclusionIndicators = ['in conclusion', 'therefore', 'thus', 'the main point', 'the key is'];
    for (const indicator of conclusionIndicators) {
      const index = content.toLowerCase().indexOf(indicator);
      if (index !== -1) {
        const sentence = content.substring(index, index + 200);
        return sentence.split('.')[0] + '.';
      }
    }
    return null;
  }
}

class EntityExtractor {
  async extract(item, contentAnalysis) {
    const text = item.title + ' ' + (item.content || '');
    const entities = [];

    // Simple named entity recognition
    // In a real implementation, you'd use a proper NER service

    // Extract potential person names (capitalized words)
    const personRegex = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    let match;
    while ((match = personRegex.exec(text)) !== null) {
      entities.push({
        name: match[0],
        type: 'PERSON',
        importance: 0.6,
        context: this.getContext(text, match.index)
      });
    }

    // Extract organizations (words ending in Inc, Corp, etc.)
    const orgRegex = /\b[A-Z][a-zA-Z\s]+(Inc|Corp|LLC|Ltd|Company|Organization)\b/g;
    while ((match = orgRegex.exec(text)) !== null) {
      entities.push({
        name: match[0],
        type: 'ORG',
        importance: 0.7,
        context: this.getContext(text, match.index)
      });
    }

    // Extract locations (words starting with capital)
    const locationKeywords = ['City', 'State', 'Country', 'University', 'School'];
    locationKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b[A-Z][a-zA-Z\\s]+${keyword}\\b`, 'g');
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          name: match[0],
          type: 'LOCATION',
          importance: 0.5,
          context: this.getContext(text, match.index)
        });
      }
    });

    return entities.slice(0, 10); // Limit to top 10 entities
  }

  getContext(text, index) {
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + 100);
    return text.substring(start, end);
  }
}

class ConceptMapper {
  async map(item, contentAnalysis) {
    const text = (item.title + ' ' + (item.content || '')).toLowerCase();
    const concepts = [];

    // Predefined concept categories
    const conceptMaps = {
      'productivity': ['productivity', 'efficiency', 'workflow', 'automation', 'optimization'],
      'technology': ['ai', 'machine learning', 'artificial intelligence', 'algorithm', 'software'],
      'business': ['strategy', 'marketing', 'sales', 'revenue', 'growth', 'startup'],
      'design': ['design', 'ui', 'ux', 'user experience', 'interface', 'usability'],
      'leadership': ['leadership', 'management', 'team', 'culture', 'motivation'],
      'learning': ['learning', 'education', 'skill', 'knowledge', 'training', 'development']
    };

    Object.entries(conceptMaps).forEach(([concept, keywords]) => {
      const matches = keywords.filter(keyword => text.includes(keyword)).length;
      if (matches > 0) {
        concepts.push({
          name: concept,
          confidence: Math.min(matches / keywords.length * 2, 1),
          keywords: keywords.filter(k => text.includes(k)),
          uniqueness: this.calculateUniqueness(concept),
          actionable: this.isActionableConcept(concept),
          context: this.extractConceptContext(text, keywords)
        });
      }
    });

    return concepts.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  calculateUniqueness(concept) {
    // Simple heuristic - some concepts are more unique than others
    const uniquenessMap = {
      'productivity': 0.6,
      'technology': 0.8,
      'business': 0.5,
      'design': 0.7,
      'leadership': 0.6,
      'learning': 0.5
    };
    return uniquenessMap[concept] || 0.5;
  }

  isActionableConcept(concept) {
    const actionableConcepts = ['productivity', 'leadership', 'learning'];
    return actionableConcepts.includes(concept);
  }

  extractConceptContext(text, keywords) {
    for (const keyword of keywords) {
      const index = text.indexOf(keyword);
      if (index !== -1) {
        const start = Math.max(0, index - 30);
        const end = Math.min(text.length, index + 80);
        return text.substring(start, end);
      }
    }
    return '';
  }
}

class RelationshipDetector {
  async detect(item, knowledgeGraph) {
    const relationships = [];
    const currentItemData = await this.getItemKnowledgeData(item);

    // Compare with existing items in knowledge graph
    for (const [existingItemId, existingData] of knowledgeGraph) {
      if (existingItemId === item.id) continue;

      const relationship = this.calculateRelationship(currentItemData, existingData);
      if (relationship.strength > 0.3) {
        relationships.push({
          targetId: existingItemId,
          type: relationship.type,
          strength: relationship.strength,
          reason: relationship.reason
        });
      }
    }

    return relationships.sort((a, b) => b.strength - a.strength).slice(0, 5);
  }

  async getItemKnowledgeData(item) {
    // Extract basic knowledge data for comparison
    const text = (item.title + ' ' + (item.content || '')).toLowerCase();
    const words = text.split(/\s+/);

    return {
      words: new Set(words),
      title: item.title.toLowerCase(),
      category: item.category,
      type: item.type,
      concepts: [] // Would be populated by ConceptMapper
    };
  }

  calculateRelationship(itemData1, itemData2) {
    let strength = 0;
    let type = 'related';
    let reasons = [];

    // Word overlap
    const commonWords = new Set([...itemData1.words].filter(w => itemData2.words?.has(w)));
    const wordOverlap = commonWords.size / Math.max(itemData1.words.size, itemData2.words?.size || 1);
    if (wordOverlap > 0.1) {
      strength += wordOverlap * 0.4;
      reasons.push(`${Math.round(wordOverlap * 100)}% word overlap`);
    }

    // Category similarity
    if (itemData1.category === itemData2.category) {
      strength += 0.2;
      type = 'same-category';
      reasons.push('same category');
    }

    // Type similarity
    if (itemData1.type === itemData2.type) {
      strength += 0.1;
      reasons.push('same type');
    }

    // Title similarity
    const titleWords1 = new Set(itemData1.title.split(/\s+/));
    const titleWords2 = new Set(itemData2.title?.split(/\s+/) || []);
    const titleOverlap = new Set([...titleWords1].filter(w => titleWords2.has(w))).size;
    if (titleOverlap > 1) {
      strength += titleOverlap * 0.1;
      type = 'similar-topic';
      reasons.push('similar titles');
    }

    return {
      strength: Math.min(strength, 1),
      type,
      reason: reasons.join(', ')
    };
  }
}

class IntelligentSummarizer {
  async generate(item, contentAnalysis) {
    // Simple extractive summarization
    // In a real implementation, you'd use a proper summarization service

    const content = item.content || '';
    if (content.length < 100) {
      return {
        text: content,
        type: 'full',
        confidence: 1.0
      };
    }

    // Extract first few sentences as summary
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summaryLength = Math.min(3, Math.ceil(sentences.length * 0.3));
    const summarySentences = sentences.slice(0, summaryLength);

    return {
      text: summarySentences.join('. ') + '.',
      type: 'extractive',
      confidence: 0.7,
      originalLength: content.length,
      summaryLength: summarySentences.join('. ').length
    };
  }
}

// Create global instance
const knowledgeProcessor = new KnowledgeProcessor();