// Card factory for rendering different item types with specialized layouts
class CardFactory {
  constructor() {
    this.cardTypes = {
      article: this.createArticleCard.bind(this),
      email: this.createEmailCard.bind(this),
      event: this.createEventCard.bind(this),
      task: this.createTaskCard.bind(this)
    };
  }

  // Main factory method
  createCard(item, options = {}) {
    const cardType = item.type || 'article';
    const createFunction = this.cardTypes[cardType] || this.cardTypes.article;

    return createFunction(item, options);
  }

  // Article card (existing design enhanced)
  createArticleCard(item, options = {}) {
    const urgencyClass = this.getUrgencyClass(item.urgency);
    const progressWidth = (item.progress || 0) * 100;
    const estimatedTime = item.estimatedDuration || this.estimateReadingTime(item.content);

    return `
      <article class="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 transition-all duration-300 hover:bg-white/10 card-item ${urgencyClass}"
               data-item-id="${item.id}" data-item-type="${item.type}">
        <div class="flex items-start gap-3">
          ${this.createArticleImage(item)}
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
                ${this.getArticleType(item)}
              </span>
              <span class="text-[11px] text-slate-400 flex items-center gap-1">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i>${estimatedTime} min read
              </span>
              ${item.progress > 0 ? `<span class="text-[11px] text-slate-500">${Math.round(item.progress * 100)}% through</span>` : ''}
              ${item.hasSummary ? this.createSummaryBadge() : ''}
              ${this.createUrgencyBadge(item.urgency)}
            </div>
            <h3 class="text-[15px] font-medium tracking-tight text-slate-100 truncate">${item.title}</h3>
            <p class="text-[13px] text-slate-400 line-clamp-2">${item.content || 'No preview available'}</p>

            ${item.hasSummary ? this.createTLDRPreview(item.summary) : ''}

            ${item.progress > 0 ? `
              <div class="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-400 transition-all duration-300" style="width: ${progressWidth}%"></div>
              </div>
            ` : ''}

            <div class="mt-3 flex items-center gap-2">
              ${this.createArticleActions(item)}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // Email card with sender info and reply actions
  createEmailCard(item, options = {}) {
    const urgencyClass = this.getUrgencyClass(item.urgency);
    const typeData = item.typeData;
    const timeAgo = this.getTimeAgo(typeData.receivedAt);
    const avatarUrl = typeData.senderAvatar || this.generateAvatarUrl(typeData.senderEmail);

    return `
      <article class="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 transition-all duration-300 hover:bg-white/10 card-item ${urgencyClass}"
               data-item-id="${item.id}" data-item-type="${item.type}">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <img src="${avatarUrl}" alt="${typeData.sender}"
                 class="w-10 h-10 rounded-full ring-1 ring-white/10 object-cover">
            ${typeData.isImportant ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-slate-950"></div>' : ''}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-300 ring-1 ring-blue-400/20">
                <i data-lucide="mail" class="w-3 h-3 inline mr-1"></i>Email
              </span>
              ${typeData.isThread ? `
                <span class="text-[11px] px-1.5 py-0.5 rounded bg-purple-400/10 text-purple-300 ring-1 ring-purple-400/20">
                  ${typeData.threadCount} messages
                </span>
              ` : ''}
              ${typeData.hasAttachments ? `
                <span class="text-[11px] text-slate-400 flex items-center gap-1">
                  <i data-lucide="paperclip" class="w-3 h-3"></i>
                </span>
              ` : ''}
              <span class="text-[11px] text-slate-500">${timeAgo}</span>
              ${this.createUrgencyBadge(item.urgency)}
            </div>

            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-[13px] font-medium text-slate-300">${typeData.sender}</h3>
              ${typeData.replyNeeded ? `
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-orange-400/10 text-orange-300 ring-1 ring-orange-400/20">
                  Reply needed
                </span>
              ` : ''}
            </div>

            <h4 class="text-[15px] font-medium tracking-tight text-slate-100 truncate mb-1">${typeData.subject}</h4>
            <p class="text-[13px] text-slate-400 line-clamp-2">${typeData.preview}</p>

            <div class="mt-3 flex items-center gap-2">
              ${this.createEmailActions(item)}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // Event/calendar card with date/time prominence
  createEventCard(item, options = {}) {
    const urgencyClass = this.getUrgencyClass(item.urgency);
    const typeData = item.typeData;
    const eventDate = new Date(typeData.eventDate);
    const formattedDate = this.formatEventDate(eventDate);
    const formattedTime = this.formatEventTime(typeData.eventTime, typeData.isAllDay);
    const timeUntil = this.getTimeUntilEvent(eventDate, typeData.eventTime);

    return `
      <article class="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 transition-all duration-300 hover:bg-white/10 card-item ${urgencyClass}"
               data-item-id="${item.id}" data-item-type="${item.type}">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 text-center">
            <div class="w-12 h-12 rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/20 flex flex-col items-center justify-center">
              <span class="text-[10px] text-emerald-300 font-medium">${eventDate.toLocaleDateString('en', { month: 'short' }).toUpperCase()}</span>
              <span class="text-[16px] text-emerald-300 font-bold leading-none">${eventDate.getDate()}</span>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
                <i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i>${this.getEventType(typeData.meetingType)}
              </span>
              ${typeData.rsvpNeeded ? `
                <span class="text-[11px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-300 ring-1 ring-yellow-400/20">
                  RSVP needed
                </span>
              ` : ''}
              <span class="text-[11px] text-slate-500">${timeUntil}</span>
              ${this.createUrgencyBadge(item.urgency)}
            </div>

            <h3 class="text-[15px] font-medium tracking-tight text-slate-100 truncate">${item.title}</h3>

            <div class="flex items-center gap-4 mt-1 text-[13px] text-slate-400">
              <span class="flex items-center gap-1">
                <i data-lucide="clock" class="w-3.5 h-3.5"></i>${formattedTime}
              </span>
              ${typeData.location ? `
                <span class="flex items-center gap-1 truncate">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5 flex-shrink-0"></i>
                  <span class="truncate">${typeData.location}</span>
                </span>
              ` : ''}
            </div>

            ${typeData.attendees && typeData.attendees.length > 0 ? `
              <div class="flex items-center gap-1 mt-2">
                <i data-lucide="users" class="w-3.5 h-3.5 text-slate-400"></i>
                <span class="text-[12px] text-slate-400">${typeData.attendees.length} attendee${typeData.attendees.length !== 1 ? 's' : ''}</span>
              </div>
            ` : ''}

            <div class="mt-3 flex items-center gap-2">
              ${this.createEventActions(item)}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // Task card with progress and due date
  createTaskCard(item, options = {}) {
    const urgencyClass = this.getUrgencyClass(item.urgency);
    const typeData = item.typeData;
    const isOverdue = this.isTaskOverdue(typeData.dueDate);
    const dueDateFormatted = this.formatDueDate(typeData.dueDate);
    const progressPercent = typeData.totalSubtasks > 0 ?
      (typeData.completedSubtasks / typeData.totalSubtasks) * 100 :
      (item.progress * 100);

    return `
      <article class="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 transition-all duration-300 hover:bg-white/10 card-item ${urgencyClass}"
               data-item-id="${item.id}" data-item-type="${item.type}">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 pt-0.5">
            <button class="task-complete-btn w-5 h-5 rounded border-2 border-slate-400 hover:border-slate-300 transition-colors flex items-center justify-center ${typeData.status === 'completed' ? 'bg-green-500 border-green-500' : ''}"
                    data-item-id="${item.id}">
              ${typeData.status === 'completed' ? '<i data-lucide="check" class="w-3 h-3 text-white"></i>' : ''}
            </button>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] px-1.5 py-0.5 rounded bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/20">
                <i data-lucide="check-square" class="w-3 h-3 inline mr-1"></i>Task
              </span>
              ${typeData.priority !== 'medium' ? `
                <span class="text-[11px] px-1.5 py-0.5 rounded ${this.getPriorityClasses(typeData.priority)}">
                  ${typeData.priority} priority
                </span>
              ` : ''}
              ${isOverdue ? `
                <span class="text-[11px] px-1.5 py-0.5 rounded bg-red-400/10 text-red-300 ring-1 ring-red-400/20">
                  Overdue
                </span>
              ` : ''}
              ${this.createUrgencyBadge(item.urgency)}
            </div>

            <h3 class="text-[15px] font-medium tracking-tight text-slate-100 truncate ${typeData.status === 'completed' ? 'line-through opacity-60' : ''}">${item.title}</h3>

            <div class="flex items-center gap-4 mt-1 text-[13px] text-slate-400">
              ${typeData.dueDate ? `
                <span class="flex items-center gap-1 ${isOverdue ? 'text-red-300' : ''}">
                  <i data-lucide="calendar" class="w-3.5 h-3.5"></i>${dueDateFormatted}
                </span>
              ` : ''}
              ${typeData.project ? `
                <span class="flex items-center gap-1 truncate">
                  <i data-lucide="folder" class="w-3.5 h-3.5 flex-shrink-0"></i>
                  <span class="truncate">${typeData.project}</span>
                </span>
              ` : ''}
            </div>

            ${typeData.totalSubtasks > 0 ? `
              <div class="mt-2">
                <div class="flex items-center justify-between text-[12px] text-slate-400 mb-1">
                  <span>${typeData.completedSubtasks}/${typeData.totalSubtasks} subtasks</span>
                  <span>${Math.round(progressPercent)}%</span>
                </div>
                <div class="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-violet-400 transition-all duration-300" style="width: ${progressPercent}%"></div>
                </div>
              </div>
            ` : ''}

            <div class="mt-3 flex items-center gap-2">
              ${this.createTaskActions(item)}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // Action button generators for each type
  createArticleActions(item) {
    return `
      <button class="read-btn inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 ring-1 ring-cyan-500/25 transition-colors"
              data-action="read" data-item-id="${item.id}">
        <i data-lucide="book-open" class="w-4 h-4"></i>
        ${item.progress > 0 ? 'Continue' : 'Read'}
      </button>
      <button class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors"
              data-action="bookmark" data-item-id="${item.id}">
        <i data-lucide="bookmark" class="w-4 h-4"></i>
        Save
      </button>
    `;
  }

  createEmailActions(item) {
    const typeData = item.typeData;
    return `
      ${typeData.replyNeeded ? `
        <button class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 ring-1 ring-blue-500/25 transition-colors"
                data-action="reply" data-item-id="${item.id}">
          <i data-lucide="reply" class="w-4 h-4"></i>
          Reply
        </button>
      ` : ''}
      <button class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors"
              data-action="open-email" data-item-id="${item.id}">
        <i data-lucide="external-link" class="w-4 h-4"></i>
        Open
      </button>
      <button class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors"
              data-action="archive" data-item-id="${item.id}">
        <i data-lucide="archive" class="w-4 h-4"></i>
        Archive
      </button>
    `;
  }

  createEventActions(item) {
    const typeData = item.typeData;
    return `
      ${typeData.rsvpNeeded ? `
        <button class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-green-500/15 hover:bg-green-500/25 text-green-300 ring-1 ring-green-500/25 transition-colors"
                data-action="rsvp-yes" data-item-id="${item.id}">
          <i data-lucide="check" class="w-4 h-4"></i>
          Accept
        </button>
        <button class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors"
                data-action="rsvp-maybe" data-item-id="${item.id}">
          <i data-lucide="help-circle" class="w-4 h-4"></i>
          Maybe
        </button>
      ` : `
        <button class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/25 transition-colors"
                data-action="add-calendar" data-item-id="${item.id}">
          <i data-lucide="calendar-plus" class="w-4 h-4"></i>
          Add to Calendar
        </button>
      `}
      ${typeData.location ? `
        <button class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors"
                data-action="directions" data-item-id="${item.id}">
          <i data-lucide="navigation" class="w-4 h-4"></i>
          Directions
        </button>
      ` : ''}
    `;
  }

  createTaskActions(item) {
    const typeData = item.typeData;
    return `
      ${typeData.status !== 'completed' ? `
        <button class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 ring-1 ring-violet-500/25 transition-colors"
                data-action="start-task" data-item-id="${item.id}">
          <i data-lucide="play" class="w-4 h-4"></i>
          ${typeData.status === 'todo' ? 'Start' : 'Continue'}
        </button>
        <button class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 ring-1 ring-white/10 transition-colors"
                data-action="schedule-task" data-item-id="${item.id}">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          Schedule
        </button>
      ` : `
        <span class="inline-flex items-center gap-1.5 text-[13px] px-2.5 py-1.5 rounded-md bg-green-500/15 text-green-300 ring-1 ring-green-500/25">
          <i data-lucide="check-circle" class="w-4 h-4"></i>
          Completed
        </span>
      `}
    `;
  }

  // Utility methods
  getUrgencyClass(urgency) {
    const classes = {
      low: '',
      normal: '',
      high: 'ring-yellow-500/20',
      urgent: 'ring-red-500/30 bg-red-500/5'
    };
    return classes[urgency] || '';
  }

  createUrgencyBadge(urgency) {
    if (urgency === 'urgent') {
      return `<span class="text-[11px] px-1.5 py-0.5 rounded bg-red-400/10 text-red-300 ring-1 ring-red-400/20">Urgent</span>`;
    } else if (urgency === 'high') {
      return `<span class="text-[11px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-300 ring-1 ring-yellow-400/20">High</span>`;
    }
    return '';
  }

  getPriorityClasses(priority) {
    const classes = {
      low: 'bg-slate-400/10 text-slate-300 ring-1 ring-slate-400/20',
      high: 'bg-red-400/10 text-red-300 ring-1 ring-red-400/20'
    };
    return classes[priority] || classes.low;
  }

  createSummaryBadge() {
    return `
      <span class="text-[11px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20 flex items-center gap-1">
        <i data-lucide="zap" class="w-3 h-3"></i>
        AI Summary
      </span>
    `;
  }

  createTLDRPreview(summary) {
    if (!summary?.tldr) return '';

    return `
      <div class="mt-2 p-2 rounded-md bg-emerald-500/5 ring-1 ring-emerald-500/10">
        <div class="flex items-start gap-2">
          <i data-lucide="zap" class="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0"></i>
          <div class="flex-1 min-w-0">
            <span class="text-[11px] text-emerald-300 font-medium">TL;DR</span>
            <p class="text-[12px] text-slate-300 leading-relaxed line-clamp-2">${summary.tldr}</p>
          </div>
        </div>
      </div>
    `;
  }

  createArticleImage(item) {
    // Debug logging
    console.log('Creating image for item:', item.title, {
      imageUrl: item.imageUrl,
      favicon: item.favicon,
      url: item.url,
      type: item.type
    });

    // Priority: article image > favicon > default icon
    if (item.imageUrl) {
      return `<img src="${item.imageUrl}"
                   alt="${item.title || 'Article'}"
                   class="w-14 h-14 rounded-md object-cover ring-1 ring-white/10"
                   onload="this.classList.add('loaded')"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
              ${this.createImageFallback(item)}`;
    }

    if (item.favicon) {
      return this.createFaviconFallback(item);
    }

    if (item.url) {
      return this.createDomainFallback(item);
    }

    return this.createDefaultIcon(item);
  }

  createImageFallback(item) {
    return `<div class="w-14 h-14 rounded-md bg-white/5 ring-1 ring-white/10 flex items-center justify-center" style="display: none;">
              ${item.favicon ?
                `<img src="${item.favicon}" alt="${this.getDomain(item.url)}" class="w-8 h-8 rounded object-contain">` :
                this.createDomainIcon(item)
              }
            </div>`;
  }

  createFaviconFallback(item) {
    if (!item.favicon) return this.createDomainFallback(item);

    return `
      <div class="w-14 h-14 rounded-md bg-white/5 ring-1 ring-white/10 flex items-center justify-center">
        <img src="${item.favicon}"
             alt="${this.getDomain(item.url)}"
             class="w-8 h-8 rounded object-contain"
             onerror="this.onerror=null; this.parentNode.innerHTML='${this.createDomainIcon(item)}'">
      </div>
    `;
  }

  createDomainFallback(item) {
    return `
      <div class="w-14 h-14 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-500/20 ring-1 ring-cyan-500/30 flex items-center justify-center">
        ${this.createDomainIcon(item)}
      </div>
    `;
  }

  createDomainIcon(item) {
    if (item.url) {
      const domain = this.getDomain(item.url);
      const initial = domain.charAt(0).toUpperCase();
      return `<span class="text-[16px] font-bold text-cyan-300">${initial}</span>`;
    }
    return `<i data-lucide="file-text" class="w-6 h-6 text-slate-400"></i>`;
  }

  createDefaultIcon(item) {
    const iconMap = {
      article: 'file-text',
      email: 'mail',
      event: 'calendar',
      task: 'check-square'
    };

    const icon = iconMap[item.type] || 'file-text';

    return `
      <div class="w-14 h-14 rounded-md bg-slate-700 ring-1 ring-white/10 flex items-center justify-center">
        <i data-lucide="${icon}" class="w-6 h-6 text-slate-400"></i>
      </div>
    `;
  }

  getDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Unknown';
    }
  }

  generateAvatarUrl(email) {
    // Generate a simple avatar URL based on email hash
    const hash = this.simpleHash(email);
    const colors = ['6366f1', '8b5cf6', 'ec4899', 'f59e0b', '10b981', '06b6d4'];
    const color = colors[hash % colors.length];
    const initial = email ? email.charAt(0).toUpperCase() : '?';
    return `https://ui-avatars.com/api/?name=${initial}&background=${color}&color=fff&size=40`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  getTimeUntilEvent(eventDate, eventTime) {
    const now = new Date();
    const eventDateTime = new Date(eventDate + 'T' + (eventTime || '00:00'));
    const diffMs = eventDateTime - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return 'Past event';
    if (diffHours < 1) return 'Starting soon';
    if (diffHours < 24) return `in ${diffHours}h`;
    if (diffDays < 7) return `in ${diffDays}d`;
    return eventDateTime.toLocaleDateString();
  }

  formatEventDate(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  formatEventTime(time, isAllDay) {
    if (isAllDay) return 'All day';
    if (!time) return '';

    const [hours, minutes] = time.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  }

  formatDueDate(dateString) {
    if (!dateString) return '';

    const dueDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueDate.toDateString() === today.toDateString()) return 'Due today';
    if (dueDate.toDateString() === tomorrow.toDateString()) return 'Due tomorrow';

    return `Due ${dueDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
  }

  isTaskOverdue(dueDate) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  getArticleType(item) {
    if (item.typeData?.source === 'newsletter') return 'Newsletter';
    if (item.url) return 'Article';
    return 'Note';
  }

  getEventType(meetingType) {
    const types = {
      meeting: 'Meeting',
      call: 'Call',
      social: 'Social',
      personal: 'Personal',
      conference: 'Conference'
    };
    return types[meetingType] || 'Event';
  }

  estimateReadingTime(content) {
    if (!content) return 5;
    const wordCount = content.split(' ').length;
    return Math.max(1, Math.round(wordCount / 200)); // 200 WPM average
  }
}

// Create global instance
const cardFactory = new CardFactory();