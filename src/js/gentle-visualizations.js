// Gentle visualization components - Ambient, calm data presentation
class GentleVisualizations {
  constructor() {
    this.colors = {
      dawn: ['#fef3c7', '#fcd34d', '#f59e0b'],      // Warm morning glow
      day: ['#bfdbfe', '#60a5fa', '#3b82f6'],       // Clear sky blue
      dusk: ['#fce7f3', '#f472b6', '#ec4899'],      // Soft sunset pink
      night: ['#e0e7ff', '#a78bfa', '#8b5cf6'],     // Gentle purple
      earth: ['#d1fae5', '#6ee7b7', '#10b981'],     // Natural green
      calm: ['#f1f5f9', '#cbd5e1', '#64748b']       // Neutral grays
    };

    this.animations = {
      gentle: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      soft: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      organic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    };
  }

  // Ambient time pattern visualization
  createTimeFlow(container, data, options = {}) {
    const {
      width = 300,
      height = 120,
      colorScheme = 'dusk',
      title = 'Your reading rhythm'
    } = options;

    const svg = this.createSVG(container, width, height);
    const colors = this.colors[colorScheme];

    // Create gradient definitions
    const defs = svg.appendChild(this.createElement('defs'));
    const gradient = defs.appendChild(this.createElement('linearGradient', {
      id: `timeflow-${Date.now()}`,
      x1: '0%', y1: '0%', x2: '100%', y2: '0%'
    }));

    gradient.appendChild(this.createElement('stop', {
      offset: '0%',
      'stop-color': colors[0],
      'stop-opacity': '0.8'
    }));

    gradient.appendChild(this.createElement('stop', {
      offset: '50%',
      'stop-color': colors[1],
      'stop-opacity': '0.6'
    }));

    gradient.appendChild(this.createElement('stop', {
      offset: '100%',
      'stop-color': colors[2],
      'stop-opacity': '0.4'
    }));

    // Create flowing curve based on data
    const timeSlots = ['morning', 'afternoon', 'evening', 'night'];
    const points = timeSlots.map((slot, i) => {
      const value = data[slot] || 0;
      const x = (i / (timeSlots.length - 1)) * width;
      const y = height - (value * height * 0.6) - height * 0.2;
      return { x, y, value };
    });

    // Create smooth path
    const path = this.createSmoothPath(points);
    const pathElement = svg.appendChild(this.createElement('path', {
      d: path,
      fill: 'none',
      stroke: `url(#timeflow-${Date.now()})`,
      'stroke-width': '3',
      'stroke-linecap': 'round'
    }));

    // Animate path drawing
    const pathLength = pathElement.getTotalLength();
    pathElement.style.strokeDasharray = pathLength;
    pathElement.style.strokeDashoffset = pathLength;

    requestAnimationFrame(() => {
      pathElement.style.transition = `stroke-dashoffset 2s ${this.animations.gentle}`;
      pathElement.style.strokeDashoffset = '0';
    });

    // Add gentle glow points
    points.forEach((point, i) => {
      if (point.value > 0) {
        const circle = svg.appendChild(this.createElement('circle', {
          cx: point.x,
          cy: point.y,
          r: Math.max(3, point.value * 8),
          fill: colors[1],
          opacity: '0'
        }));

        setTimeout(() => {
          circle.style.transition = `opacity 1s ${this.animations.soft}`;
          circle.style.opacity = '0.7';
        }, i * 200);
      }
    });

    return {
      element: container,
      update: (newData) => this.updateTimeFlow(svg, newData, colors)
    };
  }

  // Organic progress visualization
  createProgressRing(container, progress, options = {}) {
    const {
      size = 80,
      strokeWidth = 8,
      colorScheme = 'earth',
      label = '',
      showPercentage = false
    } = options;

    const svg = this.createSVG(container, size, size);
    const colors = this.colors[colorScheme];
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress * circumference);

    // Background circle
    const bgCircle = svg.appendChild(this.createElement('circle', {
      cx: size / 2,
      cy: size / 2,
      r: radius,
      fill: 'none',
      stroke: colors[0],
      'stroke-width': strokeWidth,
      opacity: '0.3'
    }));

    // Progress circle
    const progressCircle = svg.appendChild(this.createElement('circle', {
      cx: size / 2,
      cy: size / 2,
      r: radius,
      fill: 'none',
      stroke: colors[2],
      'stroke-width': strokeWidth,
      'stroke-linecap': 'round',
      'stroke-dasharray': circumference,
      'stroke-dashoffset': circumference,
      transform: `rotate(-90 ${size / 2} ${size / 2})`
    }));

    // Animate progress
    requestAnimationFrame(() => {
      progressCircle.style.transition = `stroke-dashoffset 1.5s ${this.animations.organic}`;
      progressCircle.style.strokeDashoffset = offset.toString();
    });

    // Add center text if needed
    if (label || showPercentage) {
      const text = svg.appendChild(this.createElement('text', {
        x: size / 2,
        y: size / 2,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: colors[2],
        'font-size': '12',
        'font-weight': '500'
      }));

      text.textContent = showPercentage ?
        `${Math.round(progress * 100)}%` :
        label;
    }

    return {
      element: container,
      update: (newProgress) => this.updateProgressRing(progressCircle, newProgress, circumference)
    };
  }

  // Ambient heat map for time patterns
  createGentleHeatMap(container, data, options = {}) {
    const {
      width = 280,
      height = 140,
      colorScheme = 'dawn',
      days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      hours = ['Morning', 'Afternoon', 'Evening', 'Night']
    } = options;

    const svg = this.createSVG(container, width, height);
    const colors = this.colors[colorScheme];
    const cellWidth = width / hours.length;
    const cellHeight = height / days.length;

    // Find max value for normalization
    const maxValue = Math.max(...Object.values(data).flat().filter(v => v !== undefined));

    days.forEach((day, dayIndex) => {
      hours.forEach((hour, hourIndex) => {
        const value = data[dayIndex]?.[hourIndex] || 0;
        const intensity = maxValue > 0 ? value / maxValue : 0;

        // Create cell with organic shape
        const x = hourIndex * cellWidth + cellWidth * 0.1;
        const y = dayIndex * cellHeight + cellHeight * 0.1;
        const w = cellWidth * 0.8;
        const h = cellHeight * 0.8;

        const rect = svg.appendChild(this.createElement('rect', {
          x, y, width: w, height: h,
          rx: '8',
          ry: '8',
          fill: this.interpolateColor(colors[0], colors[2], intensity),
          opacity: '0'
        }));

        // Staggered animation
        setTimeout(() => {
          rect.style.transition = `opacity 0.8s ${this.animations.soft}`;
          rect.style.opacity = Math.max(0.1, intensity).toString();
        }, (dayIndex + hourIndex) * 50);

        // Add hover effect
        rect.addEventListener('mouseenter', () => {
          rect.style.transition = `all 0.3s ${this.animations.gentle}`;
          rect.style.transform = 'scale(1.05)';
          rect.style.filter = 'brightness(1.1)';
        });

        rect.addEventListener('mouseleave', () => {
          rect.style.transform = 'scale(1)';
          rect.style.filter = 'brightness(1)';
        });
      });
    });

    // Add gentle labels
    this.addGentleLabels(svg, days, hours, width, height, cellWidth, cellHeight);

    return {
      element: container,
      update: (newData) => this.updateHeatMap(svg, newData, colors)
    };
  }

  // Flowing completion pattern
  createCompletionFlow(container, completions, options = {}) {
    const {
      width = 320,
      height = 60,
      colorScheme = 'earth',
      maxItems = 30
    } = options;

    const svg = this.createSVG(container, width, height);
    const colors = this.colors[colorScheme];

    // Show last N completions as flowing dots
    const recentCompletions = completions.slice(-maxItems);
    const itemWidth = width / maxItems;

    recentCompletions.forEach((completion, index) => {
      const x = index * itemWidth + itemWidth / 2;
      const baseY = height / 2;

      // Different y position based on content type
      const typeOffset = {
        article: -10,
        email: 0,
        task: 10,
        event: 5
      };

      const y = baseY + (typeOffset[completion.type] || 0);
      const size = Math.max(3, completion.importance || 5);

      const circle = svg.appendChild(this.createElement('circle', {
        cx: x,
        cy: y + 20, // Start below
        r: size,
        fill: colors[completion.type === 'article' ? 2 : 1],
        opacity: '0'
      }));

      // Animate upward float
      setTimeout(() => {
        circle.style.transition = `all 1s ${this.animations.organic}`;
        circle.style.transform = `translateY(-20px)`;
        circle.style.opacity = '0.8';
      }, index * 100);

      // Add gentle pulse
      setTimeout(() => {
        circle.style.animation = 'gentle-pulse 3s infinite ease-in-out';
      }, 1000 + index * 100);
    });

    return {
      element: container,
      update: (newCompletions) => this.updateCompletionFlow(svg, newCompletions, colors)
    };
  }

  // Organic content preference visualization
  createContentPreference(container, preferences, options = {}) {
    const {
      size = 120,
      colorScheme = 'dusk'
    } = options;

    const svg = this.createSVG(container, size, size);
    const colors = this.colors[colorScheme];
    const center = size / 2;

    // Create organic blobs for each content type
    const types = Object.keys(preferences);
    const total = Object.values(preferences).reduce((a, b) => a + b, 0);

    let currentAngle = 0;

    types.forEach((type, index) => {
      const value = preferences[type];
      const percentage = value / total;
      const angle = percentage * 2 * Math.PI;

      // Create organic segment
      const path = this.createOrganicSegment(center, center, 35, currentAngle, currentAngle + angle);

      const segment = svg.appendChild(this.createElement('path', {
        d: path,
        fill: colors[index % colors.length],
        opacity: '0',
        stroke: 'rgba(255,255,255,0.1)',
        'stroke-width': '1'
      }));

      // Animate in
      setTimeout(() => {
        segment.style.transition = `opacity 0.8s ${this.animations.soft}`;
        segment.style.opacity = '0.8';
      }, index * 200);

      currentAngle += angle;
    });

    return {
      element: container,
      update: (newPreferences) => this.updateContentPreference(svg, newPreferences, colors)
    };
  }

  // Utility methods
  createSVG(container, width, height) {
    const svg = this.createElement('svg', {
      width: width.toString(),
      height: height.toString(),
      viewBox: `0 0 ${width} ${height}`,
      style: 'overflow: visible;'
    });

    container.innerHTML = '';
    container.appendChild(svg);
    return svg;
  }

  createElement(tag, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }

  createSmoothPath(points) {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currentPoint = points[i];
      const nextPoint = points[i + 1];

      let cpx1, cpy1, cpx2, cpy2;

      if (nextPoint) {
        cpx1 = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.3;
        cpy1 = prevPoint.y + (currentPoint.y - prevPoint.y) * 0.3;
        cpx2 = currentPoint.x - (nextPoint.x - prevPoint.x) * 0.1;
        cpy2 = currentPoint.y - (nextPoint.y - prevPoint.y) * 0.1;
      } else {
        cpx1 = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.3;
        cpy1 = prevPoint.y + (currentPoint.y - prevPoint.y) * 0.3;
        cpx2 = currentPoint.x;
        cpy2 = currentPoint.y;
      }

      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${currentPoint.x} ${currentPoint.y}`;
    }

    return path;
  }

  createOrganicSegment(cx, cy, radius, startAngle, endAngle) {
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  }

  interpolateColor(color1, color2, factor) {
    const c1 = this.hexToRgb(color1);
    const c2 = this.hexToRgb(color2);

    if (!c1 || !c2) return color1;

    const r = Math.round(c1.r + (c2.r - c1.r) * factor);
    const g = Math.round(c1.g + (c2.g - c1.g) * factor);
    const b = Math.round(c1.b + (c2.b - c1.b) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  addGentleLabels(svg, days, hours, width, height, cellWidth, cellHeight) {
    const labelColor = '#94a3b8';
    const fontSize = '10';

    // Hour labels
    hours.forEach((hour, index) => {
      const text = svg.appendChild(this.createElement('text', {
        x: (index * cellWidth + cellWidth / 2).toString(),
        y: (height + 15).toString(),
        'text-anchor': 'middle',
        fill: labelColor,
        'font-size': fontSize,
        opacity: '0'
      }));
      text.textContent = hour;

      setTimeout(() => {
        text.style.transition = `opacity 0.5s ${this.animations.gentle}`;
        text.style.opacity = '0.7';
      }, 800 + index * 100);
    });

    // Day labels
    days.forEach((day, index) => {
      const text = svg.appendChild(this.createElement('text', {
        x: '-5',
        y: (index * cellHeight + cellHeight / 2 + 3).toString(),
        'text-anchor': 'end',
        fill: labelColor,
        'font-size': fontSize,
        opacity: '0'
      }));
      text.textContent = day;

      setTimeout(() => {
        text.style.transition = `opacity 0.5s ${this.animations.gentle}`;
        text.style.opacity = '0.7';
      }, 600 + index * 100);
    });
  }

  // Update methods for data changes
  updateTimeFlow(svg, newData, colors) {
    // Gentle transition to new data
    // Implementation would update the path with smooth animation
  }

  updateProgressRing(circle, newProgress, circumference) {
    const newOffset = circumference - (newProgress * circumference);
    circle.style.transition = `stroke-dashoffset 1s ${this.animations.organic}`;
    circle.style.strokeDashoffset = newOffset.toString();
  }

  updateHeatMap(svg, newData, colors) {
    // Update heat map cells with gentle transitions
    // Implementation would update cell colors smoothly
  }

  updateCompletionFlow(svg, newCompletions, colors) {
    // Add new completion dots with flowing animation
    // Implementation would add new dots and remove old ones
  }

  updateContentPreference(svg, newPreferences, colors) {
    // Morphs the organic segments to new proportions
    // Implementation would animate segment size changes
  }
}

// Add CSS for gentle animations
const gentleAnimationsCSS = `
@keyframes gentle-pulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
}

@keyframes aurora-flow {
  0% { transform: translateX(-10%) rotate(0deg); }
  50% { transform: translateX(10%) rotate(180deg); }
  100% { transform: translateX(-10%) rotate(360deg); }
}

@keyframes gentle-glow {
  0%, 100% { filter: brightness(1) blur(0px); }
  50% { filter: brightness(1.1) blur(1px); }
}

.gentle-viz-container {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
}

.gentle-viz-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
  animation: aurora-flow 8s infinite ease-in-out;
}

.viz-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255,255,255,0.8);
  margin-bottom: 0.75rem;
  text-align: center;
}

.viz-subtitle {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.6);
  margin-top: 0.5rem;
  text-align: center;
  font-style: italic;
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = gentleAnimationsCSS;
document.head.appendChild(style);

// Create global instance
const gentleVisualizations = new GentleVisualizations();