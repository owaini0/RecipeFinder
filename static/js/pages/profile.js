$(document).ready(function() {
    console.log("Profile page JS initialized");
    
    $('.tab').click(function() {
        const tabId = $(this).data('tab');
        
        $('.tab').removeClass('active');
        $(this).addClass('active');
        
        $('.tab-content').removeClass('active');
        $(`#${tabId}-tab`).addClass('active');
    });

    function getCsrfToken() {
        if (typeof utils !== 'undefined' && typeof utils.getCsrfToken === 'function') {
            return utils.getCsrfToken();
        }
        
        console.log("Falling back to local CSRF token implementation");
        try {
            const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/);
            if (cookieMatch) {
                console.log("Found CSRF token in cookie");
                return cookieMatch[1];
            }
        } catch (e) {
            console.error("Error getting CSRF from cookie:", e);
        }
        
        try {
            const tokenField = document.querySelector('input[name="csrfmiddlewaretoken"]');
            if (tokenField) {
                console.log("Found CSRF token in input field");
                return tokenField.value;
            }
        } catch (e) {
            console.error("Error getting CSRF from input:", e);
        }
        
        console.warn("No CSRF token found - request may fail");
        return '';
    }

    function refreshFollowerCount() {
        const followBtn = $('.follow-btn');
        if (followBtn.length > 0) {
            const userId = followBtn.data('user-id');
            if (userId) {
                console.log("Fetching current follower count for user:", userId);
                
                $.ajax({
                    url: '/user/follow/status/',
                    type: 'GET',
                    data: {
                        'user_id': userId
                    },
                    success: function(data) {
                        console.log("Follow status data:", data);
                        
                        if (data.followers_count !== undefined) {
                            const followersCount = $('.stat:nth-child(2) .stat-value');
                            if (followersCount.length > 0) {
                                followersCount.text(data.followers_count);
                                console.log("Updated follower count to:", data.followers_count);
                            }
                        }
                        
                        if (data.following_count !== undefined) {
                            const followingCount = $('.stat:nth-child(3) .stat-value');
                            if (followingCount.length > 0) {
                                followingCount.text(data.following_count);
                                console.log("Updated following count to:", data.following_count);
                            }
                        }
                        
                        if (data.following) {
                            followBtn.html('<i class="fas fa-user-minus"></i> Unfollow');
                            followBtn.addClass('following');
                        } else {
                            followBtn.html('<i class="fas fa-user-plus"></i> Follow');
                            followBtn.removeClass('following');
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error("Error fetching follow status:", error);
                        console.error("Status:", status);
                        if (xhr.responseText) {
                            try {
                                const response = JSON.parse(xhr.responseText);
                                console.error("Response:", response);
                            } catch (e) {
                                console.error("Raw response:", xhr.responseText);
                            }
                        }
                    }
                });
            }
        }
    }
    
    // Try to refresh the count when page loads
    refreshFollowerCount();

    // Direct follow/unfollow functionality without relying on CSRF setup
    $('.follow-btn').click(function(e) {
        e.preventDefault(); // Prevent any default behavior
        console.log("Follow button clicked");
        
        const button = $(this);
        const userId = button.data('user-id');
        const userName = button.data('user-name') || 'this user';
        
        if (!userId) {
            console.error('Missing user ID for follow action');
            alert('Could not identify user to follow');
            return;
        }
        
        console.log(`Attempting to follow/unfollow user: ${userId}`);
        
        // Get the token when needed
        const csrfToken = getCsrfToken();
        
        // Make the AJAX request with error handling
        try {
            console.log("Sending follow/unfollow request");
            
            $.ajax({
                url: '/user/follow/',
                type: 'POST',
                data: {
                    'user_id': userId,
                    'csrfmiddlewaretoken': csrfToken  // Include token in request data as fallback
                },
                headers: {
                    'X-CSRFToken': csrfToken  // Also set in header as per Django docs
                },
                success: function(data) {
                    console.log("Follow request successful:", data);
                    
                    if (data.following) {
                        button.html('<i class="fas fa-user-minus"></i> Unfollow');
                        button.addClass('following');
                        
                        // Show success notification
                        try {
                            if (typeof Notify !== 'undefined' && typeof Notify.success === 'function') {
                                Notify.success(`You are now following ${userName}`);
                            }
                        } catch (e) {
                            console.error("Error showing notification:", e);
                        }
                    } else {
                        button.html('<i class="fas fa-user-plus"></i> Follow');
                        button.removeClass('following');
                        
                        // Show info notification
                        try {
                            if (typeof Notify !== 'undefined' && typeof Notify.info === 'function') {
                                Notify.info(`You are no longer following ${userName}`);
                            }
                        } catch (e) {
                            console.error("Error showing notification:", e);
                        }
                    }
                    
                    // Update followers count
                    try {
                        const followersCount = $('.stat:nth-child(2) .stat-value');
                        if (followersCount.length > 0) {
                            followersCount.text(data.followers_count);
                            console.log("Updated followers count to:", data.followers_count);
                        }
                    } catch (e) {
                        console.error("Error updating followers count:", e);
                    }
                },
                error: function(xhr, status, error) {
                    console.error("Follow request failed:", error);
                    console.error("Status:", status);
                    console.error("Response:", xhr.responseText);
                    
                    // Show error message and log detailed info
                    if (xhr.responseText) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            console.error("Parsed error response:", response);
                        } catch (e) {
                            console.error("Raw error response:", xhr.responseText);
                        }
                    }
                    
                    alert('Error updating follow status. Please try again.');
                }
            });
        } catch (e) {
            console.error("Error sending follow request:", e);
            alert('An unexpected error occurred. Please try again.');
        }
    });

    // File upload handling is now handled in edit_profile.js

    // Form validation before submission is now handled in edit_profile.js
});
