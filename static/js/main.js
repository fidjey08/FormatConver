document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM已加载，开始初始化应用');
    // 获取DOM元素
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileFormat = document.getElementById('fileFormat');
    const clearFileBtn = document.getElementById('clearFileBtn');
    const srcFormat = document.getElementById('srcFormat');
    const dstFormat = document.getElementById('dstFormat');
    const encoder = document.getElementById('encoder');
    const qscale = document.getElementById('qscale');
    const qscaleValue = document.getElementById('qscaleValue');
    const qscaleQualityLabel = document.getElementById('qscaleQualityLabel');
    const convertBtn = document.getElementById('convertBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const statusSection = document.getElementById('statusSection');
    const taskStatusContainer = document.getElementById('taskStatusContainer');
    const refreshStatusBtn = document.getElementById('refreshStatusBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // 支持的格式和编码器
    let supportedFormats = {
        video: [],
        audio: [],
        image: []
    };

    let supportedEncoders = {
        video: [],
        audio: []
    };

    // 当前上传的文件信息
    let currentFiles = [];
    let currentFileIndex = 0;
    let currentFileId = null;
    let isProcessing = false;

    // 检查登录状态
    console.log('检查登录状态...');
    checkLoginStatus();

    // 更新qscale质量标签的函数
    function updateQscaleQualityLabel(value, labelElement) {
        if (!labelElement) return;

        const numValue = parseInt(value);
        if (numValue <= 5) {
            labelElement.textContent = '最高质量';
            labelElement.style.color = 'var(--success-color)';
        } else if (numValue <= 10) {
            labelElement.textContent = '高质量';
            labelElement.style.color = 'var(--success-color)';
        } else if (numValue <= 15) {
            labelElement.textContent = '中等质量';
            labelElement.style.color = 'var(--warning-color)';
        } else if (numValue <= 25) {
            labelElement.textContent = '低质量';
            labelElement.style.color = 'var(--warning-color)';
        } else {
            labelElement.textContent = '最低质量';
            labelElement.style.color = 'var(--danger-color)';
        }
    }

    // 加载支持的格式和编码器
    console.log('加载支持的格式和编码器...');
    loadFormatsAndEncoders();
    
    // 获取服务器允许的最大文件大小
    function getMaxUploadFileSize() {
        return fetch('/api/getuploadfilemaxsize', {
            credentials: 'include' // 包含Cookie
        })
        .then(response => {
            // 检查响应状态
            if (response.status === 401) {
                // 未登录，跳转到登录页
                window.location.href = '/login';
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 200) {
                // 假设后端返回的是MB，转换为字节
                const maxSizeInMB = data.maxsize;
                console.log(`服务器返回的最大文件大小: ${maxSizeInMB} MB`);
                return maxSizeInMB * 1024 * 1024; // 转换为字节
            } else {
                throw new Error(data.msg || '获取最大文件大小失败');
            }
        })
        .catch(error => {
            console.error('获取最大文件大小错误:', error);
            // 返回默认值 1GB (1024MB)
            console.log('使用默认最大文件大小: 1024 MB');
            return 1024 * 1024 * 1024;
        });
    }
    
    // 启动登录状态轮询
    setInterval(checkLoginStatus, 30000); // 每30秒检查一次登录状态

    // 拖放事件处理
    if (dropZone) {
        dropZone.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
    } else {
        console.warn('dropZone元素不存在，跳过事件绑定');
    }

    // 文件选择处理
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    } else {
        console.warn('fileInput元素不存在，跳过事件绑定');
    }

    // 清除文件按钮
    if (clearFileBtn) {
        clearFileBtn.addEventListener('click', clearFile);
    } else {
        console.warn('clearFileBtn元素不存在，跳过事件绑定');
    }

    // 格式变化处理
    if (dstFormat) {
        dstFormat.addEventListener('change', function() {
            if (typeof updateEncoderOptions === 'function') {
                updateEncoderOptions();
            } else {
                console.warn('updateEncoderOptions函数不存在');
            }
            // 当选择了目标格式时，启用转换按钮
            if (dstFormat.value) {
                if (convertBtn) convertBtn.disabled = false;
            }
        });
    } else {
        console.warn('dstFormat元素不存在，跳过事件绑定');
    }

    // 转换按钮点击事件
    if (convertBtn) {
        convertBtn.addEventListener('click', convertFile);
    } else {
        console.warn('convertBtn元素不存在，跳过事件绑定');
    }

    // 退出登录按钮点击事件
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    } else {
        console.warn('logoutBtn元素不存在，跳过事件绑定');
    }

    // 刷新状态按钮点击事件
    if (refreshStatusBtn) {
        refreshStatusBtn.addEventListener('click', checkTaskStatus);
    } else {
        console.warn('refreshStatusBtn元素不存在，跳过事件绑定');
    }

    // 下载按钮点击事件
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (currentFiles.length > 0) {
                downloadFile(currentFiles[0]);
            }
        });
    } else {
        console.warn('downloadBtn元素不存在，跳过事件绑定');
    }

    // 标签页切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                switchTab(tabName);
            });
        });
    } else {
        console.warn('未找到标签页按钮，跳过事件绑定');
    }

    // 编码器过滤按钮
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const filterType = this.getAttribute('data-type');
                if (typeof filterEncoders === 'function') {
                    filterEncoders(filterType);
                } else {
                    console.warn('filterEncoders函数不存在');
                }

                // 更新按钮状态
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
    } else {
        console.warn('未找到编码器过滤按钮，跳过事件绑定');
    }

    // 编码器搜索
    const encoderSearch = document.getElementById('encoderSearch');
    if (encoderSearch) {
        encoderSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            if (typeof filterEncodersBySearch === 'function') {
                filterEncodersBySearch(searchTerm);
            } else {
                console.warn('filterEncodersBySearch函数不存在');
            }
        });
    } else {
        console.warn('encoderSearch元素不存在，跳过事件绑定');
    }

    // qscale滑块事件监听
    function handleQscaleChange() {
        if (!qscale || !qscaleValue || !qscaleQualityLabel) {
            console.warn('qscale滑块元素不存在');
            return;
        }

        // 确保值有效
        const value = qscale.value || '1';
        qscaleValue.textContent = value;
        updateQscaleQualityLabel(value, qscaleQualityLabel);

        // 更新滑块背景
        updateQscaleSliderBackground(qscale);
    }

    // 更新滑块背景的函数
    function updateQscaleSliderBackground(slider) {
        if (!slider) return;

        const min = parseInt(slider.min) || 1;
        const max = parseInt(slider.max) || 31;
        const val = parseInt(slider.value) || 1;

        // 计算滑块填充百分比
        const percentage = ((val - min) / (max - min)) * 100;

        // 设置滑块背景
        slider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${percentage}%, #e9ecef ${percentage}%, #e9ecef 100%)`;
    }

    // 初始化滑块值
    window.addEventListener('load', function() {
        handleQscaleChange();

        // 初始化滑块背景
        if (qscale) {
            updateQscaleSliderBackground(qscale);
        }
    });

    // 添加滑块变化事件监听
    if (qscale) {
        qscale.addEventListener('input', handleQscaleChange);
        // 确保在页面加载后也触发一次
        setTimeout(handleQscaleChange, 100);
    } else {
        console.warn('qscale滑块元素不存在，跳过事件绑定');
    }

    // 处理拖放
    function handleDragOver(e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFiles(files);
        }
    }

    // 处理文件选择
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            processFiles(files);
        }
    }

    // 检查文件格式是否支持
    function isSupportedFormat(extension) {
        const allFormats = [...supportedFormats.video, ...supportedFormats.audio, ...supportedFormats.image];
        return allFormats.includes(extension.toUpperCase());
    }

    // 处理文件
    function processFile(file) {
        console.log('处理文件:', file.name);
        // 获取服务器允许的最大文件大小
        getMaxUploadFileSize()
            .then(maxSize => {
            
                // 检查文件大小
                if (file.size > maxSize) {
                    showNotification(`文件大小不能超过${formatFileSize(maxSize)}`, 'error');
                    return;
                }

                // 提取文件扩展名
                const extension = file.name.split('.').pop().toLowerCase();
                if (!isSupportedFormat(extension)) {
                    showNotification(`不支持的文件格式: ${extension}`, 'error');
                    return;
                }
        
                // 检查是否已有文件，且扩展名不同
                if (currentFiles.length > 0) {
                    const firstFileExtension = currentFiles[0].extension;
                    if (firstFileExtension !== extension) {
                        showNotification('不能添加不同后缀的文件，请重新选择', 'error');
                        clearFile();
                        return;
                    }
                }

                // 文件信息现在通过updateFileListDisplay函数显示

                // 重复的扩展名提取代码已删除

                // 源文件格式设置移至updateFileListDisplay函数

                // 文件信息区域现在通过updateFileListDisplay函数显示

                // 保存当前文件
                currentFiles.push({
                    file: file,
                    extension: extension,
                    fileId: null,
                    status: 'pending'
                });

                // 更新文件列表显示
                updateFileListDisplay();
        
                // 如果是第一个文件，更新目标格式选项
                if (currentFiles.length === 1) {
                    updateDstFormatOptions(extension);
                }
        
                // 启用转换按钮
                convertBtn.disabled = false;
            })
            .catch(error => {
                console.error('处理文件错误:', error);
                showNotification('处理文件失败', 'error');
            });
    }

    // 处理多个文件
    function processFiles(files) {
        // 确保files是一个数组
        if (!files) {
            console.warn('没有文件需要处理');
            return;
        }
        
        // 如果files不是数组，将其转换为数组
        if (typeof files.length === 'undefined') {
            files = [files];
        }
        
        // 处理每个文件
        for (let i = 0; i < files.length; i++) {
            processFile(files[i]);
        }
    }
    
    // 更新文件列表显示
    function updateFileListDisplay() {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';
        
        currentFiles.forEach((fileInfo, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            let statusIcon = '<i class="fas fa-clock"></i>';
            let statusText = '等待中';
            
            if (fileInfo.status === 'processing') {
                statusIcon = '<i class="fas fa-spinner fa-spin"></i>';
                statusText = '处理中';
            } else if (fileInfo.status === 'completed') {
                statusIcon = '<i class="fas fa-check-circle"></i>';
                statusText = '已完成';
            } else if (fileInfo.status === 'error') {
                statusIcon = '<i class="fas fa-exclamation-circle"></i>';
                statusText = '错误';
            }
            
            fileItem.innerHTML = `
                <div class="file-details">
                    <i class="fas fa-file"></i>
                    <div class="file-info">
                        <div class="file-name">${fileInfo.file.name}</div>
                        <div class="file-size">${formatFileSize(fileInfo.file.size)}</div>
                    </div>
                    <div class="file-status">
                        <span class="status-icon">${statusIcon}</span>
                        <span class="status-text">${statusText}</span>
                    </div>
                </div>
            `;
            
            fileList.appendChild(fileItem);
        });
        
        // 显示文件信息区域
        fileInfo.style.display = 'block';
        dropZone.style.display = 'none';
        
        // 如果有文件，启用转换按钮
        if (currentFiles.length > 0) {
            convertBtn.disabled = false;
            
            // 设置源文件格式（只对第一个文件）
            if (currentFiles.length === 1 && currentFiles[0]) {
                srcFormat.value = currentFiles[0].extension.toUpperCase();
                // 只在没有选择目标格式时更新目标格式选项
                if (!dstFormat.value) {
                    updateDstFormatOptions(currentFiles[0].extension);
                }
            }
        } else {
            // 没有文件时重置目标格式选项
            dstFormat.innerHTML = '<option value="">请选择目标格式</option>';
            convertBtn.disabled = true;
        }
    }
    
    // 转换所有文件
    function convertAllFiles() {
        if (isProcessing || currentFiles.length === 0) return;
        
        isProcessing = true;
        convertAllBtn.disabled = true;
        convertAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 转换中...';
        
        // 开始转换第一个文件
        processNextFile();
    }
    
    // 处理下一个文件
    function processNextFile() {
        if (currentFileIndex >= currentFiles.length) {
            // 所有文件处理完成
            isProcessing = false;
            convertAllBtn.disabled = false;
            convertAllBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 转换全部';
            showNotification('所有文件转换完成', 'success');
            return;
        }
        
        const fileInfo = currentFiles[currentFileIndex];
        convertSingleFile(fileInfo);
    }
    
    // 转换单个文件
    function convertSingleFile(fileInfo) {
        const selectedEncoder = encoder.value || '';

        // 检查是否选择了目标格式
        if (!dstFormat.value) {
            showNotification('请选择目标格式', 'error');
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 开始转换';
            return;
        }

        // 更新文件状态
        fileInfo.status = 'processing';
        updateFileListDisplay();

        // 清空任务状态容器，确保单个文件转换时不会出现多余的状态框
        taskStatusContainer.innerHTML = '';

        // 创建任务状态显示
        createTaskStatusDisplay(fileInfo, currentFileIndex);

        // 单个文件转换不需要自动处理下一个文件，因为这是独立操作

        // 确保使用唯一的tempId，避免ID冲突
        fileInfo.tempId = Date.now().toString();

        // 先上传文件
        uploadFile(fileInfo.file)
        .then(fileId => {
            fileInfo.fileId = fileId;

            // 更新文件ID显示
            if (fileInfo.taskElements && fileInfo.taskElements.fileId) {
                const fileIdEl = document.getElementById(fileInfo.taskElements.fileId);
                if (fileIdEl) fileIdEl.textContent = fileId;
            }

            // 发送转换请求
            return fetch('/api/file/conver', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `fileid=${fileId}&src_format=${fileInfo.extension}&dst_format=${dstFormat.value}&encoder=${selectedEncoder}&qscale=${qscale ? qscale.value : '1'}`,
                credentials: 'include' // 包含Cookie
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                // 开始轮询任务状态
                checkTaskStatus(fileInfo);
                showNotification(`已提交 ${fileInfo.file.name} 的转换任务`, 'success');

                // 单个文件转换完成后，重置转换按钮状态
                convertBtn.disabled = false;
                convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 开始转换';
            } else {
                throw new Error(data.msg || '转换失败');
            }
        })
        .catch(error => {
            console.error('转换错误:', error);
            showNotification(`转换 ${fileInfo.file.name} 失败: ${error.message}`, 'error');
            fileInfo.status = 'error';
            updateFileListDisplay();

            // 单个文件转换失败后，重置转换按钮状态
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 开始转换';
            

        });
    }
    
    // 检查任务状态
    function checkTaskStatus(fileInfo) {
        if (!fileInfo.fileId) return;

        fetch(`/api/file/taskinfo?fileid=${fileInfo.fileId}`, {
            credentials: 'include' // 包含Cookie
        })
        .then(response => {
            // 检查响应状态
            if (response.status === 401) {
                // 未登录，跳转到登录页
                window.location.href = '/login';
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 200) {
                const state = data.state;
                const size = data.size || 0;

                // 更新文件状态
                if (state) {
                    fileInfo.status = 'completed';
                    updateFileListDisplay();
                    
                    // 处理下一个文件
                    currentFileIndex++;
                    processNextFile();
                } else {
                    // 继续轮询
                    setTimeout(() => checkTaskStatus(fileInfo), 2000);
                }
            }
        })
        .catch(error => {
            console.error('获取任务状态错误:', error);
            
            // 出错时尝试处理下一个文件
            currentFileIndex++;
            processNextFile();
        });
    }
    
    // 清除文件
    function clearFile() {
        currentFiles = [];
        currentFileIndex = 0;
        fileInput.value = '';
        fileInfo.style.display = 'none';
        dropZone.style.display = 'block';
        srcFormat.value = '';
        dstFormat.innerHTML = '<option value="">请选择目标格式</option>';
        encoder.value = '';
        isProcessing = false;
        convertBtn.disabled = true;
        convertAllBtn.disabled = true;

        // 隐藏状态区域
        statusSection.style.display = 'none';
    }

    // 更新目标格式选项
    function updateDstFormatOptions(srcExt) {
        // 保存当前选中的目标格式
        const selectedDstFormat = dstFormat.value;
        
        // 重置目标格式选项
        dstFormat.innerHTML = '<option value="">请选择目标格式</option>';
        
        // 确定源文件格式所属的类别
        let categoryFormats = [];
        
        // 将源扩展名转换为大写以进行比较
        const srcExtUpper = srcExt.toUpperCase();
        
        if (supportedFormats.video.includes(srcExtUpper)) {
            // 如果是视频格式，同时显示视频和音频格式
            categoryFormats = [...new Set([...supportedFormats.video, ...supportedFormats.audio])];
        } else if (supportedFormats.audio.includes(srcExtUpper)) {
            categoryFormats = supportedFormats.audio;
        } else if (supportedFormats.image.includes(srcExtUpper)) {
            categoryFormats = supportedFormats.image;
        }
        
        // 只添加同类别格式作为选项
        if (categoryFormats.length > 0) {
            categoryFormats.forEach(format => {
                if (format !== srcExtUpper) {
                    dstFormat.innerHTML += `<option value="${format}">${format}</option>`;
                }
            });
            
            // 当有目标格式选项时，启用转换按钮
            convertBtn.disabled = false;
            
            // 恢复用户之前选择的目标格式
            if (selectedDstFormat) {
                dstFormat.value = selectedDstFormat;
            }
        } else {
            // 没有可用格式时禁用转换按钮
            convertBtn.disabled = true;
        }
    }

    // 更新编码器选项
    function updateEncoderOptions() {
        // 将所有编码器都添加到下拉框中
        encoder.innerHTML = '<option value="">默认编码器</option>';
        
        // 添加所有视频编码器
        supportedEncoders.video.forEach(enc => {
            encoder.innerHTML += `<option value="${enc}">${enc}</option>`;
        });
        
        // 添加所有音频编码器
        supportedEncoders.audio.forEach(enc => {
            encoder.innerHTML += `<option value="${enc}">${enc}</option>`;
        });
    }

    // 上传文件
    function uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        return fetch('/api/file/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include' // 包含Cookie
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.fileid;
            } else {
                throw new Error(data.error || '上传失败');
            }
        });
    }

    // 转换文件
    function convertFile() {
        // 处理所有文件
        processNextFile(0);
    }
    
    // 创建任务状态显示
    function createTaskStatusDisplay(fileInfo, index) {
        // 确保状态区域可见
        statusSection.style.display = 'block';
        
        // 任务状态容器已在调用此函数前清空（如果是单个文件转换）
        
        // 添加任务索引到文件信息中
        fileInfo.index = index;
        // 如果tempId已经存在，使用它；否则使用index
        if (!fileInfo.tempId) {
            fileInfo.tempId = index;
        }

        // 保存文件的目标格式
        fileInfo.dstFormat = (dstFormat.value || 'output').toLowerCase();
        
        // 创建任务状态框
        const taskStatusBox = document.createElement('div');
        taskStatusBox.className = 'task-status-box';
        // 使用临时ID，直到上传完成
        taskStatusBox.id = `taskStatusBox-${fileInfo.tempId}`;
        
        // 创建任务状态头部
        const taskStatusHeader = document.createElement('div');
        taskStatusHeader.className = 'task-status-header';
        
        // 创建文件ID显示
        const fileIdDiv = document.createElement('div');
        fileIdDiv.className = 'file-id';
        fileIdDiv.innerHTML = `文件ID: <span id="fileId-${fileInfo.tempId}">-</span>`;
        
        // 创建状态指示器
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'status-indicator';
        statusIndicator.id = `statusIndicator-${fileInfo.tempId}`;
        statusIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
        
        // 添加头部元素
        taskStatusHeader.appendChild(fileIdDiv);
        taskStatusHeader.appendChild(statusIndicator);
        
        // 创建任务状态详情
        const taskStatusDetails = document.createElement('div');
        taskStatusDetails.className = 'task-status-details';
        
        // 创建进度条
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.id = `progressFill-${fileInfo.tempId}`;
        progressFill.style.width = '0%';
        
        // 添加进度条
        progressBar.appendChild(progressFill);
        
        // 创建状态信息
        const statusInfo = document.createElement('div');
        statusInfo.className = 'status-info';
        
        const statusText = document.createElement('div');
        statusText.innerHTML = `状态: <span id="taskStatus-${fileInfo.tempId}">处理中</span>`;
        
        const sizeText = document.createElement('div');
        sizeText.innerHTML = `文件大小: <span id="taskSize-${fileInfo.tempId}">-</span>`;
        
        // 添加状态信息
        statusInfo.appendChild(statusText);
        statusInfo.appendChild(sizeText);
        
        // 添加详情元素
        taskStatusDetails.appendChild(progressBar);
        taskStatusDetails.appendChild(statusInfo);
        
        // 创建任务状态操作按钮
        const taskStatusActions = document.createElement('div');
        taskStatusActions.className = 'task-status-actions';
        
        // 创建刷新按钮
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-outline';
        refreshBtn.innerHTML = '<i class="fas fa-sync"></i> 刷新状态';
        refreshBtn.id = `refreshBtn-${fileInfo.tempId}`;
        
        // 创建下载按钮
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-success';
        downloadBtn.style.display = 'none';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> 下载文件';
        downloadBtn.id = `downloadBtn-${fileInfo.tempId}`;
        
        // 添加操作按钮
        taskStatusActions.appendChild(refreshBtn);
        taskStatusActions.appendChild(downloadBtn);
        
        // 添加所有部分到任务状态框
        taskStatusBox.appendChild(taskStatusHeader);
        taskStatusBox.appendChild(taskStatusDetails);
        taskStatusBox.appendChild(taskStatusActions);
        
        // 添加到容器
        taskStatusContainer.appendChild(taskStatusBox);
        
        // 保存任务状态元素的引用
        fileInfo.taskElements = {
            fileId: `fileId-${fileInfo.tempId}`,
            statusIndicator: `statusIndicator-${fileInfo.tempId}`,
            progressFill: `progressFill-${fileInfo.tempId}`,
            taskStatus: `taskStatus-${fileInfo.tempId}`,
            taskSize: `taskSize-${fileInfo.tempId}`,
            refreshBtn: `refreshBtn-${fileInfo.tempId}`,
            downloadBtn: `downloadBtn-${fileInfo.tempId}`
        };
        
        // tempId已经在前面设置过了，不需要重复设置
        
        // 添加事件监听器
        refreshBtn.addEventListener('click', () => checkTaskStatus(fileInfo));
        downloadBtn.addEventListener('click', () => downloadFile(fileInfo));
    }
    
    // 处理下一个文件
    function processNextFile(index) {
        if (index >= currentFiles.length) {
            // 所有文件都处理完了
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 开始转换';
            showNotification('所有文件转换完成', 'success');
            return;
        }
        
        const fileInfo = currentFiles[index];
        // 检查任务是否已经处理过
        if (fileInfo.status === 'processing' || fileInfo.status === 'completed' || fileInfo.status === 'failed') {
            // 如果已经处理过，直接处理下一个任务
            setTimeout(() => processNextFile(index + 1), 1000);
            return;
        }
        // 添加索引到文件信息中
        fileInfo.index = index;
        // 确保使用唯一的tempId，避免ID冲突
        fileInfo.tempId = Date.now().toString();

        // 保存文件的目标格式
        fileInfo.dstFormat = (dstFormat.value || 'output').toLowerCase();

        


        const selectedEncoder = encoder.value || '';

        // 检查是否选择了目标格式
        if (!dstFormat.value) {
            showNotification('请选择目标格式', 'error');
            convertBtn.disabled = false;
            convertBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 开始转换';
            return;
        }

        // 创建任务状态显示
        // 批量转换时不清空任务状态容器，保留所有任务的状态显示
        createTaskStatusDisplay(fileInfo, index);
        
        // 处理文件

        
        // 更新文件状态
        fileInfo.status = 'processing';
        updateFileListDisplay();
        
        // 先上传文件
        uploadFile(fileInfo.file)
        .then(fileId => {
            fileInfo.fileId = fileId;

            // 显示状态区域
            statusSection.style.display = 'block';
            if (fileInfo.taskElements && fileInfo.taskElements.fileId) {
                const fileIdEl = document.getElementById(fileInfo.taskElements.fileId);
                if (fileIdEl) fileIdEl.textContent = fileId;
            }
            
            // 更新文件ID，确保任务状态显示正确
            fileInfo.fileId = fileId;
            
            // 更新任务状态元素的ID，使用真实的fileId
            if (fileInfo.tempId && fileInfo.tempId !== index) {
                // 更新所有元素的ID
                const elements = fileInfo.taskElements;
                const oldId = fileInfo.tempId;
                const newId = fileId;
                
                // 更新DOM元素的ID
                document.getElementById(`taskStatusBox-${oldId}`).id = `taskStatusBox-${newId}`;
                document.getElementById(`fileId-${oldId}`).id = `fileId-${newId}`;
                document.getElementById(`statusIndicator-${oldId}`).id = `statusIndicator-${newId}`;
                document.getElementById(`progressFill-${oldId}`).id = `progressFill-${newId}`;
                document.getElementById(`taskStatus-${oldId}`).id = `taskStatus-${newId}`;
                document.getElementById(`taskSize-${oldId}`).id = `taskSize-${newId}`;
                document.getElementById(`refreshBtn-${oldId}`).id = `refreshBtn-${newId}`;
                document.getElementById(`downloadBtn-${oldId}`).id = `downloadBtn-${newId}`;
                
                // 更新taskElements中的ID引用
                elements.fileId = `fileId-${newId}`;
                elements.statusIndicator = `statusIndicator-${newId}`;
                elements.progressFill = `progressFill-${newId}`;
                elements.taskStatus = `taskStatus-${newId}`;
                elements.taskSize = `taskSize-${newId}`;
                elements.refreshBtn = `refreshBtn-${newId}`;
                elements.downloadBtn = `downloadBtn-${newId}`;
                
                // 更新tempId
                fileInfo.tempId = newId;
            }

            // 发送转换请求

            
            return fetch('/api/file/conver', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `fileid=${fileId}&src_format=${fileInfo.extension.toUpperCase()}&dst_format=${dstFormat.value}&encoder=${selectedEncoder}&qscale=${qscale ? qscale.value : '1'}`,
                credentials: 'include' // 包含Cookie
            });
        })
        .then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                // 开始轮询任务状态
                checkTaskStatus(fileInfo);
                showNotification('转换任务已提交', 'success');
            } else {
                throw new Error(data.msg || '转换失败');
            }
        })
        .catch(error => {
            console.error('转换错误:', error);
            showNotification(error.message, 'error');

            // 更新文件状态为失败
            fileInfo.status = 'failed';
            updateFileListDisplay();
            
            // 处理下一个文件
            setTimeout(() => processNextFile(fileInfo.index + 1), 1000);
        });
    }

    // 检查任务状态
    function checkTaskStatus(fileInfo) {
        if (!fileInfo || !fileInfo.fileId) return;

        fetch(`/api/file/taskinfo?fileid=${fileInfo.fileId}`, {
            credentials: 'include' // 包含Cookie
        })
        .then(response => {
            // 检查响应状态
            if (response.status === 401) {
                // 未登录，跳转到登录页
                window.location.href = '/login';
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data.code === 200) {
                const state = data.state;
                const taskId = data.taskid || data.fileid;
                const size = data.size || 0;
                
                // 保存任务ID
                if (taskId) {
                    fileInfo.taskId = taskId;
                }

                // 使用任务元素ID更新状态显示
                if (fileInfo.taskElements) {
                    const taskStatusEl = document.getElementById(fileInfo.taskElements.taskStatus);
                    const taskSizeEl = document.getElementById(fileInfo.taskElements.taskSize);
                    const progressFillEl = document.getElementById(fileInfo.taskElements.progressFill);
                    const statusIndicatorEl = document.getElementById(fileInfo.taskElements.statusIndicator);
                    const downloadBtnEl = document.getElementById(fileInfo.taskElements.downloadBtn);
                    
                    if (taskStatusEl) taskStatusEl.textContent = state ? '转换完成' : '处理中';
                    if (taskSizeEl) taskSizeEl.textContent = formatFileSize(size);
                    
                    // 更新进度条
                    if (state) {
                        // 任务完成时，进度条直接设置为100%
                        if (progressFillEl) progressFillEl.style.width = '100%';

                        // 清除伪加载动画
                        if (fileInfo.progressInterval) {
                            clearInterval(fileInfo.progressInterval);
                            fileInfo.progressInterval = null;
                        }
                        if (statusIndicatorEl) {
                            statusIndicatorEl.innerHTML = '<i class="fas fa-check-circle"></i> 已完成';
                            statusIndicatorEl.style.color = 'var(--success-color)';
                        }
                        
                        // 显示下载按钮
                        if (downloadBtnEl) {
                            downloadBtnEl.style.display = 'inline-block';
                            const downloadId = fileInfo.taskId || fileInfo.fileId;

                            // 确保使用正确的目标格式，并转换为小写
                            const extension = (fileInfo.dstFormat || dstFormat.value || 'output').toLowerCase();

                            // 保存文件的目标格式
                            fileInfo.dstFormat = extension;

                            downloadBtnEl.href = `/output/${downloadId}.${extension}`;
                        }
                        
                        // 更新文件状态为已完成
                        
                        if (!fileInfo.status || fileInfo.status !== 'completed') {
                            fileInfo.status = 'completed';
                            updateFileListDisplay();
                        }
                        
                        // 处理下一个文件
                        setTimeout(() => processNextFile(fileInfo.index + 1), 1000);
                    } else {
                        // 继续轮询，但只在任务未完成时
                        if (fileInfo.status !== 'completed') {
                            // 如果还没有开始伪加载动画，开始一个
                            if (!fileInfo.progressInterval && progressFillEl) {
                                // 设置一个初始进度
                                progressFillEl.style.width = '10%';

                                // 添加伪加载动画
                                let progress = 10;
                                fileInfo.progressInterval = setInterval(() => {
                                    progress += Math.random() * 15;
                                    if (progress > 90) progress = 90; // 不会超过90%，为最终完成留10%
                                    progressFillEl.style.width = `${progress}%`;
                                }, 500);
                            }

                            setTimeout(() => checkTaskStatus(fileInfo), 2000);
                        }
                    }
                }

                // 更新进度条
                if (state) {
                    if (progressFill) progressFill.style.width = '100%';
                    if (statusIndicator) {
                        statusIndicator.innerHTML = '<i class="fas fa-check-circle"></i> 已完成';
                        statusIndicator.style.color = 'var(--success-color)';
                    }
                } else {
                    if (progressFill) progressFill.style.width = '0%';
                    if (statusIndicator) {
                        statusIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
                        statusIndicator.style.color = 'var(--primary-color)';
                    }
                }
                    
                // 更新文件状态为已完成
                if (!fileInfo.status || fileInfo.status !== 'completed') {
                    fileInfo.status = 'completed';
                    updateFileListDisplay();
                }

                // 下载按钮显示已在上面处理，不需要重复处理
                    
                // 处理下一个文件已在上面处理，不需要重复处理
            }
        })
        .catch(error => {
            console.error('获取任务状态错误:', error);
        });
    }

    // 下载文件
    function downloadFile(fileInfo) {
        if (!fileInfo || (!fileInfo.fileId && !fileInfo.taskId)) return;
        
        // 使用任务ID作为下载文件名
        const downloadId = fileInfo.taskId || fileInfo.fileId;

        // 确保使用正确的目标格式，并转换为小写
        const extension = (fileInfo.dstFormat || dstFormat.value || 'output').toLowerCase();

        const downloadUrl = `/output/${downloadId}.${extension}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${downloadId}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // 加载支持的格式和编码器
    function loadFormatsAndEncoders() {
        // 加载支持的格式
        fetch('/api/getallformats', {
            credentials: 'include' // 包含Cookie
        })
        .then(response => response.json())
        .then(data => {
            if (data.VideoFormats) supportedFormats.video = data.VideoFormats;
            if (data.AudioFormats) supportedFormats.audio = data.AudioFormats;
            if (data.ImageFormats) supportedFormats.image = data.ImageFormats;

            // 更新格式显示
            updateFormatDisplay();
        })
        .catch(error => {
            console.error('加载格式失败:', error);
        });

        // 加载支持的编码器
        fetch('/api/getallencoders', {
            credentials: 'include' // 包含Cookie
        })
        .then(response => response.json())
        .then(data => {
            if (data.VideoEncoders) supportedEncoders.video = data.VideoEncoders;
            if (data.AudioEncoders) supportedEncoders.audio = data.AudioEncoders;

            // 更新编码器显示
            updateEncoderDisplay();
        })
        .catch(error => {
            console.error('加载编码器失败:', error);
        });
    }

    // 更新格式显示
    function updateFormatDisplay() {
        const videoTab = document.getElementById('videoTab');
        const audioTab = document.getElementById('audioTab');
        const imageTab = document.getElementById('imageTab');

        // 更新视频格式
        let videoFormatsHtml = '';
        supportedFormats.video.forEach(format => {
            videoFormatsHtml += `<div class="format-item">${format}</div>`;
        });
        videoTab.querySelector('.format-list').innerHTML = videoFormatsHtml;

        // 更新音频格式
        let audioFormatsHtml = '';
        supportedFormats.audio.forEach(format => {
            audioFormatsHtml += `<div class="format-item">${format}</div>`;
        });
        audioTab.querySelector('.format-list').innerHTML = audioFormatsHtml;

        // 更新图片格式
        let imageFormatsHtml = '';
        supportedFormats.image.forEach(format => {
            imageFormatsHtml += `<div class="format-item">${format}</div>`;
        });
        imageTab.querySelector('.format-list').innerHTML = imageFormatsHtml;
    }

    // 更新编码器显示
    function updateEncoderDisplay() {
        const encoderList = document.querySelector('.encoder-list');
        let encodersHtml = '';

        // 添加所有编码器
        [...supportedEncoders.video, ...supportedEncoders.audio].forEach(encoder => {
            encodersHtml += `<div class="encoder-item" data-encoder="${encoder}">${encoder}</div>`;
        });

        encoderList.innerHTML = encodersHtml;

        // 添加编码器点击事件
        const encoderItems = document.querySelectorAll('.encoder-item');
        encoderItems.forEach(item => {
            item.addEventListener('click', function() {
                // 移除其他选中状态
                encoderItems.forEach(i => i.classList.remove('selected'));

                // 添加选中状态
                this.classList.add('selected');

                // 更新编码器选择
                encoder.value = this.getAttribute('data-encoder');
            });
        });
    }

    // 切换标签页
    function switchTab(tabName) {
        // 更新标签按钮状态
        tabBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });

        // 更新标签内容显示
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => {
            pane.classList.remove('active');
            if (pane.id === tabName + 'Tab') {
                pane.classList.add('active');
            }
        });
    }

    // 过滤编码器
    function filterEncoders(filterType) {
        const encoderItems = document.querySelectorAll('.encoder-item');

        encoderItems.forEach(item => {
            const encoder = item.getAttribute('data-encoder');
            let showItem = true;

            if (filterType === 'video') {
                showItem = supportedEncoders.video.includes(encoder);
            } else if (filterType === 'audio') {
                showItem = supportedEncoders.audio.includes(encoder);
            }

            item.style.display = showItem ? 'inline-block' : 'none';
        });
    }

    // 搜索编码器
    function filterEncodersBySearch(searchTerm) {
        const encoderItems = document.querySelectorAll('.encoder-item');

        encoderItems.forEach(item => {
            const encoder = item.getAttribute('data-encoder');
            const matchesSearch = encoder.toLowerCase().includes(searchTerm);
            item.style.display = matchesSearch ? 'inline-block' : 'none';
        });
    }

    // 检查登录状态
    function checkLoginStatus() {
        fetch('/api/login', {
            method: 'POST',
            credentials: 'include' // 包含Cookie
        })
        .then(response => {
            // 检查响应状态
            if (response.status === 401) {
                // 未登录，跳转到登录页
                window.location.href = '/login';
                return;
            }
            return response.json();
        })
        .then(data => {
            // 如果服务器返回401状态码，但响应体中没有code字段，这里也会处理
            if (data && data.code === 401) {
                // 未登录，跳转到登录页
                window.location.href = '/login';
            }
        })
        .catch(error => {
            console.error('检查登录状态失败:', error);
        });
    }

    // 退出登录
    function logout() {
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'password=', // 发送空密码以清除Cookie
            credentials: 'include' // 包含Cookie
        })
        .then(() => {
            showNotification('已退出登录', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        })
        .catch(error => {
            console.error('退出登录失败:', error);
        });
    }

    // 显示通知
    function showNotification(message, type) {
        const notification = document.getElementById('notification');
        const notificationIcon = notification.querySelector('.notification-icon i');
        const notificationMessage = notification.querySelector('.notification-message');

        // 设置图标和消息
        notificationMessage.textContent = message;

        // 设置图标样式
        notificationIcon.className = '';
        if (type === 'success') {
            notificationIcon.className = 'fas fa-check-circle';
            notificationIcon.classList.add('success');
        } else if (type === 'error') {
            notificationIcon.className = 'fas fa-exclamation-circle';
            notificationIcon.classList.add('error');
        } else {
            notificationIcon.className = 'fas fa-info-circle';
            notificationIcon.classList.add('info');
        }

        // 显示通知
        notification.classList.add('show');

        // 3秒后自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});