document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
});

function showToast(message, type = 'success', duration = 3000) {
    console.log(`Showing toast: ${message} (${type})`);
    
    if (type === 'error' && duration === 3000) {
        duration = 5000;
    } else if (type === 'warning' && duration === 3000) {
        duration = 4000;
    }

    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toastContainer = document.getElementById('toast-container');

    const existingToasts = toastContainer.querySelectorAll('.recipe-toast');
    existingToasts.forEach(toast => {
        const toastMessage = toast.querySelector('span').textContent;
        if (toastMessage === message) {
            toast.remove();
        }
    });

    let iconClass = 'fa-check-circle';
    let toastClass = 'recipe-toast';
    
    switch (type) {
        case 'error':
            iconClass = 'fa-exclamation-circle';
            toastClass += ' error-toast';
            break;
        case 'info':
            iconClass = 'fa-info-circle';
            toastClass += ' info-toast';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle';
            toastClass += ' warning-toast';
            break;
    }

    const toast = document.createElement('div');
    toast.className = toastClass;
    toast.innerHTML = `
        <div class="recipe-toast-content">
            <i class="fas ${iconClass}"></i>
            <span>${message}</span>
        </div>
    `;

    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close-btn';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.background = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = '#999';
    closeButton.style.fontSize = '0.85rem';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = function() {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    };
    toast.appendChild(closeButton);

    const progressBar = document.createElement('div');
    progressBar.className = 'toast-progress';
    progressBar.style.position = 'absolute';
    progressBar.style.bottom = '0';
    progressBar.style.left = '0';
    progressBar.style.height = '4px';
    progressBar.style.width = '100%';
    progressBar.style.backgroundColor = type === 'success' ? '#81B29A' : 
                                       type === 'error' ? '#e74c3c' :
                                       type === 'warning' ? '#f39c12' : '#3498db';
    progressBar.style.transition = `width ${duration}ms linear`;
    toast.appendChild(progressBar);
    
    // Add to container
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
        progressBar.style.width = '0';
    }, 10);

    const toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);
    
    toast.toastTimeout = toastTimeout;
    
    return toast;
} 