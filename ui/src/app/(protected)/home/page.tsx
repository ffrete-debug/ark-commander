"use client";

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@/navigation';
import { useAuthUser } from '@/stores/auth';
import { useImageStatus, serversActions } from '@/stores/servers';
import { ImageStatus } from '@/components/docker/ImageStatus';
import { useEffect, useRef, useCallback } from 'react';
import { Server } from 'lucide-react';

export default function HomePage() {
    const t = useTranslations('home');
    const profile = useAuthUser();
    const imageStatus = useImageStatus();
    const { getImageStatus } = serversActions;
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // 获取镜像状态
    const refreshImageStatus = useCallback(async () => {
        try {
            await getImageStatus();
        } catch (error) {
            console.error('获取镜像状态失败:', error);
        }
    }, [getImageStatus]);

    // 处理手动下载
    const handleManualDownload = async () => {
        if (!imageStatus?.images) return;

        // 找到第一个未就绪的镜像
        const notReadyImage = Object.entries(imageStatus.images).find(([, status]) => !status.ready);

        if (!notReadyImage) {
            console.log('所有镜像都已就绪');
            return;
        }

        const imageName = notReadyImage[0];
        await handleDownloadImage(imageName);
    };

    // 处理单个镜像下载
    const handleDownloadImage = async (imageName: string) => {
        try {
            const response = await fetch('/api/images/pull', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_name: imageName
                })
            });

            if (!response.ok) {
                throw new Error('下载镜像失败');
            }

            console.log(`镜像 ${imageName} 开始下载`);

            // 开始轮询状态
            startPolling();
        } catch (error) {
            console.error('下载镜像失败:', error);
        }
    };

    // 处理单个镜像更新
    const handleUpdateImage = async (imageName: string) => {
        try {
            const response = await fetch('/api/images/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_name: imageName
                })
            });

            if (!response.ok) {
                throw new Error('更新镜像失败');
            }

            console.log(`镜像 ${imageName} 开始更新`);

            // 开始轮询状态
            startPolling();
        } catch (error) {
            console.error('更新镜像失败:', error);
        }
    };

    // 处理检查更新
    const handleCheckUpdates = async () => {
        try {
            const response = await fetch('/api/images/check-updates');

            if (!response.ok) {
                throw new Error('检查更新失败');
            }

            console.log('镜像更新检查完成');

            // 刷新镜像状态以显示更新结果
            await refreshImageStatus();
        } catch (error) {
            console.error('检查更新失败:', error);
        }
    };

    // 开始轮询状态
    const startPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = setInterval(async () => {
            await refreshImageStatus();

            // 如果没有镜像在拉取中，停止轮询
            if (!imageStatus?.any_pulling) {
                stopPolling();
            }
        }, 2000);
    };

    // 停止轮询
    const stopPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    useEffect(() => {
        refreshImageStatus();

        return () => {
            stopPolling();
        };
    }, [refreshImageStatus]);

    return (
        <div className="w-full max-w-none py-8 space-y-8">
            {/* 欢迎标题区域 */}
            <Card>
                <CardContent className="p-8">
                    <div className="text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <Server className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {t('title')}
                        </h1>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            {t('subtitle')}
                        </p>
                    </div>

                    <div className="mt-8 p-4 border rounded-lg bg-gray-50">
                        <h2 className="text-xl font-semibold mb-2">{t('systemInfo')}</h2>
                        <p><strong>{t('username')}:</strong> {profile?.username}</p>
                        <p><strong>{t('userID')}:</strong> {profile?.id}</p>
                    </div>
                </CardContent>
            </Card>

            {/* 镜像管理区域 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-gray-900">
                        {t('imageManagement')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {imageStatus ? (
                        <ImageStatus
                            imageStatus={imageStatus}
                            onRefresh={refreshImageStatus}
                            onManualDownload={handleManualDownload}
                            onCheckUpdates={handleCheckUpdates}
                            onDownloadImage={handleDownloadImage}
                            onUpdateImage={handleUpdateImage}
                        />
                    ) : (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">加载镜像状态中...</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 功能卡片网格 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-gray-900">
                        {t('features')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/servers" className="block">
                            <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-blue-200">
                                <CardContent className="text-center space-y-6 p-6">
                                    <div className="mx-auto w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors">
                                        <Server className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {t('serverManagement')}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {t('serverManagementDesc')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="group-hover:bg-blue-50 text-blue-600"
                                    >
                                        {t('startManage')}
                                        <span className="ml-1">→</span>
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>

                        <Card className="h-full opacity-60 border-2 border-gray-100">
                            <CardContent className="text-center space-y-6 p-6">
                                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">👥</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                                        {t('playerManagement')}
                                    </h3>
                                    <p className="text-gray-400 leading-relaxed">
                                        {t('playerManagementDesc')}
                                    </p>
                                </div>
                                <Button variant="secondary" size="sm" disabled>
                                    {t('comingSoon')}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="h-full opacity-60 border-2 border-gray-100">
                            <CardContent className="text-center space-y-6 p-6">
                                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">📊</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-500 mb-2">
                                        {t('logMonitoring')}
                                    </h3>
                                    <p className="text-gray-400 leading-relaxed">
                                        {t('logMonitoringDesc')}
                                    </p>
                                </div>
                                <Button variant="secondary" size="sm" disabled>
                                    {t('comingSoon')}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-500">{t('tip')}</p>
        </div>
    );
}