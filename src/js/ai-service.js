// AI Service for generating article summaries
class AIService {
  constructor() {
    this.mockMode = true; // Set to false when integrating real AI API
  }

  async generateSummary(content, url = null) {
    if (this.mockMode) {
      return this.mockGenerateSummary(content, url);
    }

    // Real API implementation will go here
    return this.callRealAPI(content, url);
  }

  mockGenerateSummary(content, url) {
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const summaries = this.getMockSummaries();
        const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];

        // Customize based on content length and URL
        const customized = this.customizeMockSummary(randomSummary, content, url);

        resolve(customized);
      }, 1500 + Math.random() * 1000); // 1.5-2.5 second delay
    });
  }

  customizeMockSummary(baseSummary, content, url) {
    // Extract some actual characteristics from content
    const wordCount = this.getWordCount(content);
    const hasNumbers = /\d{1,3}[,.]?\d*[%$]?/.test(content);
    const hasList = /^\s*[\-\*\d]+[\.\)]\s/m.test(content);

    // Adjust reading time based on actual word count
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    // Customize based on URL domain if available
    let domain = '';
    if (url) {
      try {
        domain = new URL(url).hostname.replace('www.', '');
      } catch (e) {
        // Invalid URL, use default
      }
    }

    return {
      ...baseSummary,
      readingTime: {
        full: readingTime,
        summary: Math.max(1, Math.round(readingTime * 0.3))
      },
      stats: {
        wordCount,
        hasNumbers,
        hasList,
        domain
      }
    };
  }

  getMockSummaries() {
    return [
      {
        tldr: "A thoughtful exploration of building sustainable habits that focuses on consistency over perfection, emphasizing gentle progress and self-compassion.",
        keyPoints: [
          "Start with micro-habits that take less than 2 minutes",
          "Focus on consistency rather than intensity or perfect execution",
          "Use environmental design to make good habits easier",
          "Practice self-compassion when you miss a day or make mistakes",
          "Stack new habits onto existing routines for better retention"
        ],
        coreIdeas: "The article challenges the common approach of dramatic lifestyle changes, instead advocating for a gentle, sustainable method of habit formation. The author argues that most people fail at building habits because they try to do too much too quickly, leading to burnout and abandonment.\n\nThe key insight is that habits are formed through repetition, not intensity. By starting with ridiculously small actions and focusing on showing up consistently, we can build momentum that naturally leads to larger changes. The piece emphasizes that missing a day doesn't mean failure - it's part of the human experience and an opportunity to practice self-compassion.",
        keyQuotes: [
          "The goal is not to be perfect, but to be consistent enough that the habit becomes automatic.",
          "A 2-minute habit done daily for a year creates more change than a 2-hour session done once a week.",
          "Your environment shapes your behavior more than your motivation ever will."
        ]
      },
      {
        tldr: "An examination of how technology can be designed to support human well-being rather than hijack attention, with practical principles for creating calmer digital experiences.",
        keyPoints: [
          "Design for user agency rather than engagement metrics",
          "Minimize interruptions and respect attention boundaries",
          "Provide clear mental models of how systems work",
          "Use progressive disclosure to reduce cognitive load",
          "Build in natural stopping points and closure"
        ],
        coreIdeas: "This piece argues that most digital products are designed to maximize engagement and time-on-device, often at the expense of user well-being. The author proposes an alternative approach called 'calm technology' that respects human attention and supports intentional use.\n\nThe core philosophy is that technology should be ambient and peripheral until needed, then quickly help users accomplish their goals without creating dependency. This requires designing for completion rather than continuation, and measuring success by user satisfaction rather than time spent in the app.",
        keyQuotes: [
          "The best technology is invisible until you need it, then disappears again when the task is complete.",
          "If your app doesn't have a natural ending, you're probably building an addiction machine.",
          "Design for the person your user wants to be, not the behavior your metrics want to see."
        ]
      },
      {
        tldr: "A guide to creating productive workspaces that promote focus and creativity, covering everything from lighting and ergonomics to digital organization systems.",
        keyPoints: [
          "Natural light significantly impacts mood and cognitive performance",
          "Minimize visual clutter to reduce cognitive overhead",
          "Invest in ergonomic furniture for long-term physical health",
          "Create designated zones for different types of work",
          "Implement systems to keep both physical and digital spaces organized"
        ],
        coreIdeas: "The article explores how our physical and digital environments profoundly impact our ability to think clearly and work effectively. Research shows that our surroundings influence everything from stress levels to creative thinking, yet most people give little thought to optimizing their workspace.\n\nThe author provides a framework for designing environments that support different types of work - from deep focus sessions to collaborative meetings. The key is intentionality: every element in your workspace should either serve a specific purpose or bring you joy.",
        keyQuotes: [
          "Your environment is your extended mind - design it as carefully as you would organize your thoughts.",
          "Clutter in your space creates clutter in your mind.",
          "The best workspace is one that disappears, allowing you to focus entirely on your work."
        ]
      },
      {
        tldr: "An exploration of how reading physical books offers unique cognitive and emotional benefits that digital reading cannot replicate, despite the convenience of e-readers.",
        keyPoints: [
          "Physical books provide better spatial memory and comprehension",
          "The tactile experience enhances emotional connection to content",
          "Page-turning creates natural reading rhythm and pacing",
          "Physical books offer fewer distractions than digital devices",
          "Book ownership creates a personal library with sentimental value"
        ],
        coreIdeas: "While digital reading offers obvious conveniences like portability and instant access, this piece argues that we lose important elements when we abandon physical books entirely. Research suggests that the spatial and tactile aspects of physical reading contribute to better comprehension and retention.\n\nThe author doesn't dismiss digital reading but advocates for thoughtful choice about which medium to use for different purposes. For deep, contemplative reading, physical books may offer advantages that justify their inconveniences.",
        keyQuotes: [
          "A book is not just a container for information - it's a tool for thinking.",
          "The weight of a book in your hands is the weight of the ideas within it.",
          "Every dog-eared page and marginalia tells the story of a mind at work."
        ]
      }
    ];
  }

  getWordCount(content) {
    // Remove HTML tags and get word count
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  async callRealAPI(content, url) {
    // Placeholder for real API integration
    // This would call OpenAI, Claude, or another LLM API
    throw new Error("Real API not implemented yet");
  }

  // Method to easily toggle between mock and real API
  setMockMode(enabled) {
    this.mockMode = enabled;
  }

  // Method to test API connection (for real implementation)
  async testConnection() {
    if (this.mockMode) {
      return { success: true, message: "Mock mode active" };
    }

    // Test real API connection
    try {
      // Implement API health check
      return { success: true, message: "API connection successful" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Create global instance
const aiService = new AIService();