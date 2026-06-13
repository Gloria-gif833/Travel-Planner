import { useState, useEffect } from 'react';
import type { Spot } from '../../types/itinerary';
import { TRANSPORT_MODES, TRANSPORT_ICONS } from '../../types/itinerary';
import { generateSpotId } from '../../context/ItineraryContext';
import styles from './SpotEditModal.module.css';

interface SpotEditModalProps {
  open: boolean;
  spot: Spot | null; // null = 新建模式
  onClose: () => void;
  onSave: (spot: Spot) => void;
}

export default function SpotEditModal({ open, spot, onClose, onSave }: SpotEditModalProps) {
  const isNew = !spot;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [transportMode, setTransportMode] = useState('');
  const [transportDuration, setTransportDuration] = useState('');
  const [recommendReason, setRecommendReason] = useState('');
  const [ticketType, setTicketType] = useState<'免费' | '收费'>('免费');
  const [ticketPrice, setTicketPrice] = useState('');

  useEffect(() => {
    if (spot) {
      setName(spot.name);
      setDescription(spot.description);
      setDuration(spot.duration);
      setTransportMode(spot.transport?.mode ?? '');
      setTransportDuration(spot.transport?.duration ?? '');
      setRecommendReason(spot.recommendReason ?? '');
      setTicketType(spot.ticketInfo?.type ?? '免费');
      setTicketPrice(spot.ticketInfo?.price ?? '');
    } else {
      setName('');
      setDescription('');
      setDuration('1小时');
      setTransportMode('');
      setTransportDuration('');
      setRecommendReason('');
      setTicketType('免费');
      setTicketPrice('');
    }
  }, [spot, open]);

  if (!open) return null;

  const handleSave = () => {
    const updatedSpot: Spot = {
      id: spot?.id ?? generateSpotId(),
      name: name.trim() || '新景点',
      description: description.trim() || '点击编辑景点描述',
      duration: duration.trim() || '1小时',
      transport: transportMode
        ? { mode: transportMode, duration: transportDuration || '10分钟' }
        : undefined,
      tags: spot?.tags ?? [],
      recommendReason: recommendReason.trim() || undefined,
      ticketInfo: { type: ticketType, price: ticketType === '收费' ? ticketPrice.trim() || '价格待查' : undefined },
    };
    onSave(updatedSpot);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            {isNew ? '✎ 添加景点' : '✎ 编辑景点'}
          </h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>景点名称</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入景点名称"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>景点描述</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入景点描述"
              rows={3}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>💡 推荐理由（150-200字）</label>
            <textarea
              className={styles.textarea}
              value={recommendReason}
              onChange={(e) => setRecommendReason(e.target.value)}
              placeholder="为什么推荐这个景点？有什么独特之处？"
              rows={4}
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>🎫 门票类型</label>
              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value as '免费' | '收费')}
                >
                  <option value="免费">免费</option>
                  <option value="收费">收费</option>
                </select>
              </div>
            </div>
            {ticketType === '收费' && (
              <div className={styles.field}>
                <label className={styles.label}>门票价格</label>
                <input
                  className={styles.input}
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                  placeholder="如：60元/人"
                />
              </div>
            )}
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>游玩时长</label>
              <input
                className={styles.input}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="如：2小时"
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>出行方式</label>
              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                >
                  <option value="">无需出行</option>
                  {TRANSPORT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {TRANSPORT_ICONS[mode]} {mode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {transportMode && (
              <div className={styles.field}>
                <label className={styles.label}>通行时长</label>
                <input
                  className={styles.input}
                  value={transportDuration}
                  onChange={(e) => setTransportDuration(e.target.value)}
                  placeholder="如：30分钟"
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            取消
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            {isNew ? '添加' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}