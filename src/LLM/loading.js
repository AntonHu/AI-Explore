export function showLoading() {
    const frames = ['-', '\\', '|', '/'];
    let i = 0;

    return setInterval(() => {
        process.stdout.write(`\r等待模型回复 ${frames[i]}`);
        i = (i + 1) % frames.length;
    }, 100);
}

export function hideLoading(interval) {
    clearInterval(interval);
    process.stdout.write('\r'); // 清除 Loading 动画
}