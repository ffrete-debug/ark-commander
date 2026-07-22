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
import Cookies from 'js-cookie';

export default function HomePage() {
    const t = useTranslations('home');
    const profile = useAuthUser();
    const imageStatus = useImageStatus();
    const { getImageStatus } = serversActions;
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Get image status
    const refreshImageStatus = useCallback(async () => {
        try {
            await getImageStatus();
        } catch (error) {
            console.error('Failed to get image status:', error);
        }
    }, [getImageStatus]);

    // Handle manual download
    const handleManualDownload = async () => {
        if (!imageStatus?.images) return;

        // Find the first image that is not ready
        const notReadyImage = Object.entries(imageStatus.images).find(([, status]) => !status.ready);

        if (!notReadyImage) {
            console.log('All images are ready');
            return;
        }

        const imageName = notReadyImage[0];
        await handleDownloadImage(imageName);
    };

    // Handle single image download
    const handleDownloadImage = async (imageName: string) => {
        try {
            const token = Cookies.get('auth-token');
            const response = await fetch('/api/images/pull', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    image_name: imageName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to download image');
            }

            console.log(`Image ${imageName} started downloading`);

            // Start polling status
            startPolling();
        } catch (error) {
            console.error('Failed to download image:', error);
        }
    };

    // Handle single image update
    const handleUpdateImage = async (imageName: string) => {
        try {
            const token = Cookies.get('auth-token');
            const response = await fetch('/api/images/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    image_name: imageName
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update image');
            }

            console.log(`Image ${imageName} started updating`);

            // Start polling status
            startPolling();
        } catch (error) {
            console.error('Failed to update image:', error);
        }
    };

    // Handle check updates
    const handleCheckUpdates = async () => {
        try {
            const token = Cookies.get('auth-token');
            const response = await fetch('/api/images/check-updates', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to check updates');
            }

            console.log('Image update check completed');

            // Refresh image status to show update results
            await refreshImageStatus();
        } catch (error) {
            console.error('Failed to check updates:', error);
        }
    };

    // Start polling status
    const startPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
        }

        pollingIntervalRef.current = setInterval(async () => {
            await refreshImageStatus();

            // Stop polling if no images are pulling
            if (!imageStatus?.any_pulling) {
                stopPolling();
            }
        }, 2000);
    };

    // Stop polling
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
            {/* Welcome title area */}
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

            {/* Image management area */}
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
                            <p className="mt-2 text-gray-600">Loading image status...</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Feature card grid */}
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

                        <Link href="/servers" className="block">
                            <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-green-200">
                                <CardContent className="text-center space-y-6 p-6">
                                    <div className="mx-auto w-12 h-12 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center transition-colors">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {t('logMonitoring')}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {t('logMonitoringDesc')}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="group-hover:bg-green-50 text-green-600"
                                    >
                                        {t('startManage')}
                                        <span className="ml-1">→</span>
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <p className="text-center text-sm text-gray-500">{t('tip')}</p>
        </div>
    );
}
