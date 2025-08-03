/**
 * Browser Compatibility Check
 * This script checks browser compatibility for critical features used in QuantumChat
 */

// Run check when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create a container for compatibility messages
    const compatContainer = document.createElement('div');
    compatContainer.id = 'compatibility-check';
    compatContainer.style.display = 'none'; // Hidden by default
    compatContainer.style.position = 'fixed';
    compatContainer.style.bottom = '10px';
    compatContainer.style.right = '10px';
    compatContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    compatContainer.style.padding = '15px';
    compatContainer.style.borderRadius = '8px';
    compatContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    compatContainer.style.zIndex = '1000';
    compatContainer.style.maxWidth = '300px';
    document.body.appendChild(compatContainer);
    
    // Add a button to toggle compatibility info
    const toggleButton = document.createElement('button');
    toggleButton.textContent = '🔍 Browser Compatibility';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.zIndex = '1001';
    toggleButton.style.padding = '8px 12px';
    toggleButton.style.borderRadius = '4px';
    toggleButton.style.backgroundColor = '#667eea';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
    document.body.appendChild(toggleButton);
    
    toggleButton.addEventListener('click', function() {
        if (compatContainer.style.display === 'none') {
            compatContainer.style.display = 'block';
            toggleButton.textContent = '❌ Close';
        } else {
            compatContainer.style.display = 'none';
            toggleButton.textContent = '🔍 Browser Compatibility';
        }
    });
    
    // Check features and add results to container
    const features = [
        {
            name: 'TextEncoder',
            supported: typeof TextEncoder !== 'undefined',
            critical: true,
            polyfilled: typeof TextEncoder !== 'undefined' && TextEncoder.toString().includes('polyfill')
        },
        {
            name: 'TextDecoder',
            supported: typeof TextDecoder !== 'undefined',
            critical: true,
            polyfilled: typeof TextDecoder !== 'undefined' && TextDecoder.toString().includes('polyfill')
        },
        {
            name: 'WebSockets',
            supported: typeof WebSocket !== 'undefined',
            critical: true,
            polyfilled: false
        },
        {
            name: 'Crypto API',
            supported: typeof crypto !== 'undefined',
            critical: true,
            polyfilled: false
        },
        {
            name: 'Crypto.subtle',
            supported: typeof crypto !== 'undefined' && crypto.subtle !== undefined,
            critical: false,
            polyfilled: typeof crypto !== 'undefined' && crypto.subtle !== undefined && 
                      crypto.subtle.toString().includes('polyfill')
        },
        {
            name: 'Promises',
            supported: typeof Promise !== 'undefined',
            critical: true,
            polyfilled: false
        },
        {
            name: 'Uint8Array',
            supported: typeof Uint8Array !== 'undefined',
            critical: true,
            polyfilled: false
        }
    ];
    
    // Add browser info
    const browserInfo = document.createElement('div');
    browserInfo.innerHTML = `<strong>Browser:</strong> ${navigator.userAgent}`;
    browserInfo.style.marginBottom = '10px';
    browserInfo.style.fontSize = '12px';
    browserInfo.style.wordBreak = 'break-word';
    compatContainer.appendChild(browserInfo);
    
    // Add feature check results
    const featureList = document.createElement('ul');
    featureList.style.listStyle = 'none';
    featureList.style.padding = '0';
    featureList.style.margin = '0';
    
    let hasIssues = false;
    
    features.forEach(feature => {
        const item = document.createElement('li');
        item.style.marginBottom = '5px';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        
        const status = feature.supported ? '✅' : '❌';
        const polyfillStatus = feature.polyfilled ? ' (Polyfilled)' : '';
        const criticalStatus = !feature.supported && feature.critical ? ' - CRITICAL' : '';
        
        item.innerHTML = `<span style="margin-right: 5px;">${status}</span> <span>${feature.name}${polyfillStatus}${criticalStatus}</span>`;
        
        if (!feature.supported && feature.critical) {
            item.style.color = '#d32f2f';
            item.style.fontWeight = 'bold';
            hasIssues = true;
        } else if (feature.polyfilled) {
            item.style.color = '#ff9800';
        }
        
        featureList.appendChild(item);
    });
    
    compatContainer.appendChild(featureList);
    
    // Add summary
    const summary = document.createElement('div');
    summary.style.marginTop = '10px';
    summary.style.padding = '8px';
    summary.style.borderRadius = '4px';
    summary.style.fontSize = '13px';
    
    if (hasIssues) {
        summary.style.backgroundColor = '#ffebee';
        summary.style.color = '#d32f2f';
        summary.textContent = 'Your browser is missing critical features needed for QuantumChat. Some functionality may not work correctly.';
    } else {
        summary.style.backgroundColor = '#e8f5e9';
        summary.style.color = '#388e3c';
        summary.textContent = 'Your browser supports all required features for QuantumChat.';
    }
    
    compatContainer.appendChild(summary);
    
    // Log compatibility info to console
    console.log('Browser Compatibility Check:', features);
    
    // If there are critical issues, show the compatibility panel automatically
    if (hasIssues) {
        compatContainer.style.display = 'block';
        toggleButton.textContent = '❌ Close';
    }
});