document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const loginMessage = document.getElementById('loginMessage');

    // 检查是否需要密码验证
    checkPasswordRequirement();

    // 登录按钮点击事件
    loginBtn.addEventListener('click', function() {
        const password = passwordInput.value.trim();

        if (!password) {
            showLoginMessage('请输入密码', 'error');
            return;
        }

        // 禁用登录按钮，防止重复提交
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';

        // 发送登录请求
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `password=${encodeURIComponent(password)}`,
            credentials: 'include' // 包含Cookie
        })
        .then(response => {
            // 检查响应状态
            if (response.status !== 200) {
                showLoginMessage('登录失败，请检查密码', 'error');
                // 重置登录按钮
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录';
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 200) {
                showLoginMessage('登录成功，正在跳转...', 'success');
                // 登录成功后跳转到主页
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                showLoginMessage(data.message || '密码错误', 'error');
                // 重置登录按钮
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录';
            }
        })
        .catch(error => {
            console.error('登录错误:', error);
            showLoginMessage('登录失败，请稍后再试', 'error');
            // 重置登录按钮
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> 登录';
        });
    });

    // 回车键触发登录
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    // 显示登录消息
    function showLoginMessage(message, type) {
        loginMessage.textContent = message;
        loginMessage.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
        loginMessage.style.display = 'block';

        // 3秒后自动隐藏消息
        setTimeout(() => {
            loginMessage.style.display = 'none';
        }, 3000);
    }

    // 检查是否需要密码验证
    function checkPasswordRequirement() {
        fetch('/api/getconfigpasswordisempty')
        .then(response => response.json())
        .then(data => {
            if (data.code === 200 && data.state === '0') {
                // 不需要密码验证，直接跳转到主页
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('检查密码配置失败:', error);
        });
    }
});