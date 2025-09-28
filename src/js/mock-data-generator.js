// Mock data generator for testing email, calendar, and task items
class MockDataGenerator {
  constructor() {
    this.sampleEmails = [
      {
        sender: 'Sarah Chen',
        senderEmail: 'sarah.chen@company.com',
        subject: 'Project timeline update needed',
        preview: 'Hi team, I wanted to check in on the timeline for the Q4 project. Could you review the attached milestones and let me know if they align with your estimates? We need to finalize this by EOD tomorrow.',
        replyNeeded: true,
        isImportant: true,
        category: 'work',
        urgency: 'high'
      },
      {
        sender: 'Design Weekly',
        senderEmail: 'hello@designweekly.com',
        subject: 'This week: Minimalist interfaces that work',
        preview: 'Your weekly dose of design inspiration featuring clean interfaces, thoughtful interactions, and the psychology behind why less really is more in digital design.',
        replyNeeded: false,
        isImportant: false,
        category: 'inspiration',
        urgency: 'low'
      },
      {
        sender: 'Dr. Martinez',
        senderEmail: 'martinez@healthcenter.com',
        subject: 'Appointment confirmation - Next Tuesday',
        preview: 'This is to confirm your appointment scheduled for Tuesday, October 3rd at 2:30 PM. Please arrive 15 minutes early and bring your insurance card.',
        replyNeeded: false,
        isImportant: true,
        category: 'life',
        urgency: 'normal'
      },
      {
        sender: 'Mom',
        senderEmail: 'mom@family.com',
        subject: 'Re: Weekend dinner plans',
        preview: 'Sounds perfect! I\'ll make the lasagna you love. Can you pick up some of that good bread from the bakery on your way over? Also, your father wants to know if you can help him with his computer.',
        replyNeeded: true,
        isImportant: false,
        category: 'life',
        urgency: 'normal',
        isThread: true,
        threadCount: 3
      },
      {
        sender: 'GitHub',
        senderEmail: 'noreply@github.com',
        subject: '[Security] New SSH key added to your account',
        preview: 'A new SSH key was recently added to your GitHub account. If this was you, you can safely ignore this email. If this wasn\'t you, please secure your account immediately.',
        replyNeeded: false,
        isImportant: true,
        category: 'work',
        urgency: 'high'
      }
    ];

    this.sampleEvents = [
      {
        title: 'Team standup',
        eventDate: this.getTomorrowDate(),
        eventTime: '09:00',
        endTime: '09:30',
        location: 'Conference Room B',
        organizer: 'Sarah Chen',
        attendees: ['john@company.com', 'lisa@company.com', 'mike@company.com'],
        meetingType: 'meeting',
        category: 'work',
        urgency: 'normal'
      },
      {
        title: 'Coffee with Alex',
        eventDate: this.getDateInDays(3),
        eventTime: '15:00',
        endTime: '16:00',
        location: 'Blue Bottle Coffee, Downtown',
        organizer: 'Alex Thompson',
        meetingType: 'social',
        category: 'life',
        urgency: 'low'
      },
      {
        title: 'Dentist appointment',
        eventDate: this.getDateInDays(5),
        eventTime: '14:30',
        endTime: '15:30',
        location: 'Downtown Dental Care',
        rsvpNeeded: false,
        meetingType: 'personal',
        category: 'life',
        urgency: 'normal'
      },
      {
        title: 'Product roadmap review',
        eventDate: this.getDateInDays(1),
        eventTime: '14:00',
        endTime: '15:30',
        location: 'Main conference room',
        organizer: 'Product Team',
        attendees: ['product@company.com', 'engineering@company.com'],
        rsvpNeeded: true,
        meetingType: 'meeting',
        category: 'work',
        urgency: 'high'
      },
      {
        title: 'Weekend farmers market',
        eventDate: this.getNextWeekendDate(),
        eventTime: '09:00',
        isAllDay: false,
        location: 'Downtown Park',
        meetingType: 'personal',
        category: 'life',
        urgency: 'low'
      }
    ];

    this.sampleTasks = [
      {
        title: 'Review and approve marketing campaign designs',
        dueDate: this.getDateInDays(2),
        priority: 'high',
        project: 'Q4 Campaign',
        estimatedPomodoros: 3,
        subtasks: ['Review hero images', 'Check copy alignment', 'Approve color scheme', 'Sign off on final designs'],
        completedSubtasks: 1,
        category: 'work',
        urgency: 'high'
      },
      {
        title: 'Schedule annual physical checkup',
        dueDate: this.getDateInDays(7),
        priority: 'medium',
        project: 'Personal Health',
        category: 'life',
        urgency: 'normal'
      },
      {
        title: 'Update portfolio website with recent projects',
        dueDate: this.getDateInDays(14),
        priority: 'low',
        project: 'Personal Branding',
        estimatedPomodoros: 5,
        subtasks: ['Take screenshots', 'Write case studies', 'Update resume', 'Deploy changes'],
        completedSubtasks: 0,
        category: 'work',
        urgency: 'low'
      },
      {
        title: 'Plan surprise party for Jamie',
        dueDate: this.getDateInDays(10),
        priority: 'high',
        project: 'Personal',
        subtasks: ['Book venue', 'Send invitations', 'Order cake', 'Plan activities'],
        completedSubtasks: 2,
        category: 'life',
        urgency: 'normal'
      },
      {
        title: 'Fix the leaky kitchen faucet',
        dueDate: this.getDateInDays(-1), // Overdue
        priority: 'medium',
        project: 'Home Maintenance',
        category: 'life',
        urgency: 'high'
      }
    ];

    this.sampleArticles = [
      {
        title: 'The Science of Building Better Habits',
        content: 'New research reveals how small changes in our environment can lead to dramatic improvements in behavior. This comprehensive guide explores the neurological basis of habit formation and provides practical strategies for creating lasting change.',
        url: 'https://example.com/habits-science',
        author: 'Dr. James Clear',
        domain: 'example.com',
        readingTime: 8,
        category: 'inspiration',
        urgency: 'low',
        progress: 0.3
      },
      {
        title: 'Advanced React Patterns for 2024',
        content: 'A deep dive into modern React development patterns including compound components, render props, and advanced hook patterns. Learn how to write more maintainable and reusable React code.',
        url: 'https://dev.to/react-patterns',
        author: 'Sarah Developer',
        domain: 'dev.to',
        readingTime: 12,
        category: 'work',
        urgency: 'normal',
        progress: 0.7
      }
    ];
  }

  // Generate mock items of different types
  generateMockData(count = 5) {
    const items = [];

    // Generate emails
    for (let i = 0; i < Math.min(count, this.sampleEmails.length); i++) {
      items.push(this.createEmailItem(this.sampleEmails[i]));
    }

    // Generate events
    for (let i = 0; i < Math.min(count, this.sampleEvents.length); i++) {
      items.push(this.createEventItem(this.sampleEvents[i]));
    }

    // Generate tasks
    for (let i = 0; i < Math.min(count, this.sampleTasks.length); i++) {
      items.push(this.createTaskItem(this.sampleTasks[i]));
    }

    // Generate articles
    for (let i = 0; i < Math.min(count, this.sampleArticles.length); i++) {
      items.push(this.createArticleItem(this.sampleArticles[i]));
    }

    return items;
  }

  createEmailItem(emailData) {
    return {
      type: 'email',
      title: emailData.subject,
      content: emailData.preview,
      category: emailData.category,
      state: 'inbox',
      urgency: emailData.urgency,
      estimatedDuration: 3, // 3 minutes to read and respond

      // Email-specific data
      sender: emailData.sender,
      senderEmail: emailData.senderEmail,
      subject: emailData.subject,
      preview: emailData.preview,
      replyNeeded: emailData.replyNeeded,
      isThread: emailData.isThread || false,
      threadCount: emailData.threadCount || 1,
      hasAttachments: emailData.hasAttachments || false,
      isImportant: emailData.isImportant,
      receivedAt: this.getRandomPastDate(5), // Random date within last 5 days
      labels: emailData.labels || []
    };
  }

  createEventItem(eventData) {
    return {
      type: 'event',
      title: eventData.title,
      content: eventData.description || '',
      category: eventData.category,
      state: 'inbox',
      urgency: eventData.urgency,
      estimatedDuration: this.calculateEventDuration(eventData.eventTime, eventData.endTime),

      // Event-specific data
      eventDate: eventData.eventDate,
      eventTime: eventData.eventTime,
      endTime: eventData.endTime,
      isAllDay: eventData.isAllDay || false,
      location: eventData.location || '',
      locationUrl: eventData.locationUrl,
      attendees: eventData.attendees || [],
      organizer: eventData.organizer || '',
      rsvpNeeded: eventData.rsvpNeeded !== undefined ? eventData.rsvpNeeded : true,
      rsvpStatus: 'pending',
      meetingType: eventData.meetingType,
      hasReminder: true,
      reminderTime: '15 minutes before',
      recurrence: eventData.recurrence || null
    };
  }

  createTaskItem(taskData) {
    const totalSubtasks = taskData.subtasks ? taskData.subtasks.length : 0;
    const completedSubtasks = taskData.completedSubtasks || 0;

    return {
      type: 'task',
      title: taskData.title,
      content: taskData.description || '',
      category: taskData.category,
      state: 'inbox',
      urgency: taskData.urgency,
      estimatedDuration: (taskData.estimatedPomodoros || 2) * 25, // Pomodoros to minutes
      progress: totalSubtasks > 0 ? completedSubtasks / totalSubtasks : 0,

      // Task-specific data
      dueDate: taskData.dueDate,
      dueTime: taskData.dueTime || null,
      priority: taskData.priority,
      project: taskData.project || '',
      assignee: taskData.assignee || '',
      subtasks: taskData.subtasks || [],
      completedSubtasks: completedSubtasks,
      totalSubtasks: totalSubtasks,
      dependencies: taskData.dependencies || [],
      timeBlocked: false,
      estimatedPomodoros: taskData.estimatedPomodoros || 2,
      actualTimeSpent: 0,
      status: 'todo'
    };
  }

  createArticleItem(articleData) {
    return {
      type: 'article',
      title: articleData.title,
      content: articleData.content,
      url: articleData.url,
      category: articleData.category,
      state: 'library',
      urgency: articleData.urgency,
      estimatedDuration: articleData.readingTime,
      progress: articleData.progress || 0,

      // Article-specific data
      author: articleData.author || '',
      domain: articleData.domain || '',
      publishedAt: this.getRandomPastDate(30),
      wordCount: articleData.content ? articleData.content.split(' ').length : 0,
      difficulty: 'medium',
      topic: this.inferTopic(articleData.title),
      source: 'manual'
    };
  }

  // Utility methods for generating dates
  getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  getDateInDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  getNextWeekendDate() {
    const date = new Date();
    const daysUntilSaturday = (6 - date.getDay()) % 7;
    date.setDate(date.getDate() + daysUntilSaturday);
    return date.toISOString().split('T')[0];
  }

  getRandomPastDate(maxDaysAgo) {
    const date = new Date();
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    return date.toISOString();
  }

  calculateEventDuration(startTime, endTime) {
    if (!startTime || !endTime) return 60; // Default 1 hour

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end - start) / (1000 * 60); // Minutes
  }

  inferTopic(title) {
    const keywords = {
      'technology': ['react', 'javascript', 'coding', 'development', 'programming'],
      'productivity': ['habits', 'productivity', 'focus', 'time management'],
      'design': ['design', 'interface', 'ux', 'ui', 'visual'],
      'business': ['strategy', 'business', 'marketing', 'growth'],
      'health': ['health', 'wellness', 'fitness', 'mental health']
    };

    const lowerTitle = title.toLowerCase();

    for (const [topic, words] of Object.entries(keywords)) {
      if (words.some(word => lowerTitle.includes(word))) {
        return topic;
      }
    }

    return 'general';
  }

  // Add mock data to the data manager
  addMockDataToStorage() {
    const mockItems = this.generateMockData(3);

    mockItems.forEach(itemData => {
      dataManager.saveItem(itemData);
    });

    console.log(`Added ${mockItems.length} mock items to storage`);
    return mockItems;
  }

  // Generate specific type of mock data
  generateEmails(count = 3) {
    return this.sampleEmails.slice(0, count).map(email => this.createEmailItem(email));
  }

  generateEvents(count = 3) {
    return this.sampleEvents.slice(0, count).map(event => this.createEventItem(event));
  }

  generateTasks(count = 3) {
    return this.sampleTasks.slice(0, count).map(task => this.createTaskItem(task));
  }

  generateArticles(count = 2) {
    return this.sampleArticles.slice(0, count).map(article => this.createArticleItem(article));
  }

  // Clear all mock data (useful for testing)
  clearMockData() {
    const allItems = dataManager.getAllItems();
    const mockItemIds = allItems
      .filter(item => item.type !== 'article' || item.typeData?.source === 'mock')
      .map(item => item.id);

    mockItemIds.forEach(id => dataManager.deleteItem(id));
    console.log(`Removed ${mockItemIds.length} mock items`);
  }
}

// Create global instance
const mockDataGenerator = new MockDataGenerator();