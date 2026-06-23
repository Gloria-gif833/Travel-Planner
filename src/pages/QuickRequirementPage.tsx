import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversation } from '../context/ConversationContext';
import { useItinerary } from '../context/ItineraryContext';
import { useQuickRequirement, PREFERENCE_OPTIONS, DAYS_OPTIONS } from '../hooks/useQuickRequirement';
import { PROVINCES, getAllCities } from '../data/cities';
import { generateItinerary } from '../services/generateService';
import { createItinerary as saveItinerary } from '../services/itineraryService';
import { enrichItinerary } from '../utils/enrichItinerary';
import type { Requirements } from '../types/conversation';
import type { Material } from '../types/material';
import styles from '../styles/quickRequirement.module.css';

export default function QuickRequirementPage() {
  const navigate = useNavigate();
  const { state: convState, dispatch: convDispatch } = useConversation();
  const { dispatch: itineraryDispatch } = useItinerary();

  // 快速需求表单状态
  const quickReq = useQuickRequirement();

  // 城市选择器展开状态
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [departureProvince, setDepartureProvince] = useState('');
  const [destProvince, setDestProvince] = useState('');
  const [departureSearch, setDepartureSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 生成攻略的加载状态
  const [generating, setGenerating] = useState(false);
  const [showMaterialPrompt, setShowMaterialPrompt] = useState(false);
  const generationTriggered = useRef(false);

  // 所有城市平铺列表
  const allCities = getAllCities();

  /**
   * 获取某个省份下的城市列表
   */
  const getCitiesByProvince = (provinceName: string) => {
    const province = PROVINCES.find(p => p.name === provinceName);
    return province ? province.cities : [];
  };

  /**
   * 选中出发地城市
   */
  const handleSelectDeparture = (cityName: string) => {
    quickReq.setField('departure', cityName);
    setShowDeparturePicker(false);
    setDepartureSearch('');
  };

  /**
   * 选中目的地城市
   */
  const handleSelectDestination = (cityName: string) => {
    quickReq.setField('destination', cityName);
    setShowDestPicker(false);
    setDestSearch('');
  };

  /**
   * 已搜索的出发城市列表
   */
  const filteredDepartureCities = departureSearch.trim()
    ? allCities.filter(c => c.name.includes(departureSearch.trim()) || c.province.includes(departureSearch.trim()))
    : [];

  /**
   * 已搜索的目的城市列表
   */
  const filteredDestCities = destSearch.trim()
    ? allCities.filter(c => c.name.includes(destSearch.trim()) || c.province.includes(destSearch.trim()))
    : [];

  /**
   * 格式化日期
   */
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  /**
   * 提交需求 - 保存到对话上下文，进入素材询问环节
   */
  const handleSubmit = useCallback(async () => {
    if (!quickReq.isSubmittable || generating) return;

    setGenerating(true);

    // 1. 构建偏好文本
    const allPrefs = [...quickReq.state.preferences];
    if (quickReq.state.customPreference.trim()) {
      allPrefs.push(quickReq.state.customPreference.trim());
    }
    const prefText = allPrefs.length > 0 ? allPrefs.join('、') : '';

    // 2. 构造 Requirements 对象（存入 ConversationContext 以供后续使用）
    const requirements: Requirements = {
      destination: quickReq.state.destination,
      departure: quickReq.state.departure,
      travelDate: quickReq.state.travelDate,
      days: quickReq.state.days,
      budget: '',
      companions: '',
      preferences: prefText,
      accommodation: '',
      transport: '',
    };

    // 3. 保存到 ConvContext
    // 先重置对话状态，再设置需求
    convDispatch({ type: 'RESET' });
    // 将需求直接设置为已完成的
    const reqEntries: [keyof Requirements, string][] = Object.entries(requirements) as [keyof Requirements, string][];
    for (const [key, value] of reqEntries) {
      if (value) {
        convDispatch({
          type: 'UPDATE_REQUIREMENT',
          payload: { key, value },
        });
      }
    }

    // 4. 设置素材询问步骤
    convDispatch({ type: 'SET_STEP', payload: 'asking_materials' });

    // 5. 发送 AI 确认消息（需求概要 + 询问素材）
    const items: string[] = [];
    if (quickReq.state.destination) items.push(`📍 目的地：${quickReq.state.destination}`);
    if (quickReq.state.departure) items.push(`🚗 出发地：${quickReq.state.departure}`);
    if (quickReq.state.travelDate) items.push(`📅 时间：${formatDate(quickReq.state.travelDate)}`);
    if (quickReq.state.days) items.push(`⏱ 天数：${quickReq.state.days}天`);
    if (prefText) items.push(`🎯 偏好：${prefText}`);

    const summaryText =
      `太好了！我已经收到你的出行计划 🌟\n\n` +
      `**📋 你填写的需求：**\n${items.join('\n')}\n\n` +
      (quickReq.state.additionalInfo ? `**💡 补充信息：**\n${quickReq.state.additionalInfo}\n\n` : '') +
      `你是否有查看过相关的旅游攻略或帖子是你比较感兴趣的？如果有的话可以上传一些素材，我能为你生成更精准的攻略哦 😊`;

    convDispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: `msg_${Date.now()}_summary`,
        role: 'ai',
        text: summaryText,
        timestamp: Date.now(),
      },
    });

    setGenerating(false);
    setShowMaterialPrompt(true);
  }, [quickReq, generating, convDispatch]);

  /**
   * 点击「是，有素材」- 跳转到素材粘贴板
   */
  const handleGoToUpload = () => {
    // 向 convContext 添加一条用户回复，标记选择了"有素材"
    convDispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: `msg_${Date.now()}_yes`,
        role: 'user',
        text: '是的，我有素材',
        timestamp: Date.now(),
      },
    });
    navigate('/upload');
  };

  /**
   * 点击「否，直接生成」- 调用 AI 生成攻略
   */
  const handleGenerateDirectly = async () => {
    if (generationTriggered.current) return;
    generationTriggered.current = true;

    setGenerating(true);
    itineraryDispatch({ type: 'SET_LOADING', payload: true });

    try {
      // 构建需求对象
      const allPrefs = [...quickReq.state.preferences];
      if (quickReq.state.customPreference.trim()) {
        allPrefs.push(quickReq.state.customPreference.trim());
      }
      const prefText = allPrefs.length > 0 ? allPrefs.join('、') : '';

      const requirements: Requirements = {
        destination: quickReq.state.destination,
        departure: quickReq.state.departure,
        travelDate: quickReq.state.travelDate,
        days: quickReq.state.days,
        budget: '',
        companions: '',
        preferences: prefText,
        accommodation: '',
        transport: '',
      };

      // 构建简单的对话历史
      const convHistory = [
        { role: 'user' as const, content: `我想去${quickReq.state.destination}旅行` },
        { role: 'assistant' as const, content: `好的，我来为你规划${quickReq.state.destination}的行程。` },
      ];

      const result = await generateItinerary(requirements, undefined, convHistory);

      if (result?.itinerary) {
        const enriched = enrichItinerary(result.itinerary, requirements);
        saveItinerary({ title: enriched.title, data: enriched, summary: '' })
          .then(saved => { if (saved?.id) enriched.id = saved.id; })
          .catch(() => {});
        itineraryDispatch({ type: 'SET_ITINERARY', payload: enriched });
        itineraryDispatch({ type: 'ADD_TO_LIST', payload: enriched });
      }
    } catch (e) {
      console.error('【快速需求-生成攻略失败】', e);
    }

    setGenerating(false);
    itineraryDispatch({ type: 'SET_LOADING', payload: false });
    navigate('/itinerary');
  };

  // ===== 渲染 =====
  const allPreferencesText = [
    ...quickReq.state.preferences,
    ...(quickReq.state.customPreference.trim() ? [quickReq.state.customPreference.trim()] : []),
  ].join('、');

  return (
    <div className={styles.container}>
      {/* 顶部栏 */}
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/')}>
          ← 返回上一页
        </button>
        <h2 className={styles.pageTitle}>⚡ 快速需求</h2>
      </div>

      {/* 主体布局 */}
      <div className={styles.body}>
        {/* 左侧：表单区域 */}
        <div className={styles.formSection}>
          {showMaterialPrompt ? (
            /* ===== 素材询问阶段 ===== */
            <div className={styles.materialPrompt}>
              <div className={styles.aiMessage}>
                {convState.messages.filter(m => m.role === 'ai').slice(-1).map(m => (
                  <div key={m.id} className={styles.aiBubble}>{m.text}</div>
                ))}
              </div>
              <div className={styles.promptActions}>
                <button
                  className={`${styles.promptBtn} ${styles.yesBtn}`}
                  onClick={handleGoToUpload}
                  disabled={generating}
                >
                  📎 是，我有素材
                </button>
                <button
                  className={`${styles.promptBtn} ${styles.noBtn}`}
                  onClick={handleGenerateDirectly}
                  disabled={generating}
                >
                  {generating ? '⏳ 生成中...' : '⚡ 否，直接生成攻略'}
                </button>
              </div>
            </div>
          ) : (
            /* ===== 表单填写阶段 ===== */
            <>
              {/* 表单头部提示 */}
              <div className={styles.formHeader}>
                <h3 className={styles.formTitle}>✈️ 快速填写出行需求</h3>
                <p className={styles.formDesc}>选择或填写以下信息，一次性提交即可生成专属旅行攻略</p>
              </div>

              {/* 出发地 */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>📍 出发地</label>
                <div className={styles.citySelector}>
                  <div
                    className={`${styles.cityInput} ${quickReq.state.departure ? styles.cityInputFilled : ''}`}
                    onClick={() => { setShowDeparturePicker(!showDeparturePicker); setShowDestPicker(false); }}
                  >
                    {quickReq.state.departure || <span className={styles.placeholder}>请选择出发城市 ▼</span>}
                  </div>

                  {showDeparturePicker && (
                    <div className={styles.cityPicker}>
                      {/* 搜索框 */}
                      <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="搜索城市（输入中文或拼音）"
                        value={departureSearch}
                        onChange={e => setDepartureSearch(e.target.value)}
                        autoFocus
                      />

                      {departureSearch.trim() ? (
                        /* 搜索模式：展示搜索结果 */
                        <div className={styles.searchResults}>
                          {filteredDepartureCities.slice(0, 20).map(c => (
                            <div
                              key={`dep-search-${c.name}`}
                              className={styles.cityOption}
                              onClick={() => handleSelectDeparture(c.name)}
                            >
                              <span className={styles.cityName}>{c.name}</span>
                              <span className={styles.cityProvince}>{c.province}</span>
                            </div>
                          ))}
                          {filteredDepartureCities.length === 0 && (
                            <div className={styles.noResult}>未找到匹配城市</div>
                          )}
                        </div>
                      ) : (
                        /* 省份-城市级联模式 */
                        <div className={styles.provinceCityList}>
                          {!departureProvince ? (
                            /* 选择省份 */
                            <div className={styles.provinceList}>
                              {PROVINCES.map(p => (
                                <div
                                  key={`dep-prov-${p.name}`}
                                  className={styles.provinceItem}
                                  onClick={() => setDepartureProvince(p.name)}
                                >
                                  {p.name}
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* 选择城市 */
                            <div className={styles.citySelectList}>
                              <div
                                className={styles.backToProvince}
                                onClick={() => setDepartureProvince('')}
                              >
                                ← 返回省份列表
                              </div>
                              {getCitiesByProvince(departureProvince).map(c => (
                                <div
                                  key={`dep-city-${c.name}`}
                                  className={`${styles.cityItem} ${c.popular || c.travelDestination ? styles.cityItemHot : ''}`}
                                  onClick={() => handleSelectDeparture(c.name)}
                                >
                                  {c.name}
                                  {(c.popular || c.travelDestination) && <span className={styles.hotTag}>热门</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 目的地 */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>🏁 目的地 <span className={styles.required}>*</span></label>
                <div className={styles.citySelector}>
                  <div
                    className={`${styles.cityInput} ${quickReq.state.destination ? styles.cityInputFilled : ''}`}
                    onClick={() => { setShowDestPicker(!showDestPicker); setShowDeparturePicker(false); }}
                  >
                    {quickReq.state.destination || <span className={styles.placeholder}>请选择目的城市 ▼</span>}
                  </div>

                  {showDestPicker && (
                    <div className={styles.cityPicker}>
                      {/* 搜索框 */}
                      <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="搜索城市（输入中文或拼音）"
                        value={destSearch}
                        onChange={e => setDestSearch(e.target.value)}
                        autoFocus
                      />

                      {destSearch.trim() ? (
                        /* 搜索模式 */
                        <div className={styles.searchResults}>
                          {filteredDestCities.slice(0, 20).map(c => (
                            <div
                              key={`dest-search-${c.name}`}
                              className={styles.cityOption}
                              onClick={() => handleSelectDestination(c.name)}
                            >
                              <span className={styles.cityName}>{c.name}</span>
                              <span className={styles.cityProvince}>{c.province}</span>
                            </div>
                          ))}
                          {filteredDestCities.length === 0 && (
                            <div className={styles.noResult}>未找到匹配城市</div>
                          )}
                        </div>
                      ) : (
                        /* 省份-城市级联模式 */
                        <div className={styles.provinceCityList}>
                          {!destProvince ? (
                            <div className={styles.provinceList}>
                              {PROVINCES.map(p => (
                                <div
                                  key={`dest-prov-${p.name}`}
                                  className={styles.provinceItem}
                                  onClick={() => setDestProvince(p.name)}
                                >
                                  {p.name}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={styles.citySelectList}>
                              <div
                                className={styles.backToProvince}
                                onClick={() => setDestProvince('')}
                              >
                                ← 返回省份列表
                              </div>
                              {getCitiesByProvince(destProvince).map(c => (
                                <div
                                  key={`dest-city-${c.name}`}
                                  className={`${styles.cityItem} ${c.popular || c.travelDestination ? styles.cityItemHot : ''}`}
                                  onClick={() => handleSelectDestination(c.name)}
                                >
                                  {c.name}
                                  {(c.popular || c.travelDestination) && <span className={styles.hotTag}>热门</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 出行日期 */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>📅 出行日期</label>
                <div className={styles.dateSelector}>
                  <input
                    type="date"
                    className={styles.dateInput}
                    value={quickReq.state.travelDate}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onChange={e => quickReq.setField('travelDate', e.target.value)}
                  />
                  {quickReq.state.travelDate && (
                    <span className={styles.dateDisplay}>{formatDate(quickReq.state.travelDate)}</span>
                  )}
                </div>
              </div>

              {/* 游玩天数 */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>⏱ 游玩天数 <span className={styles.required}>*</span></label>
                <div className={styles.daysSelector}>
                  {DAYS_OPTIONS.map(day => (
                    <button
                      key={day}
                      className={`${styles.dayOption} ${quickReq.state.days === String(day) ? styles.dayOptionActive : ''}`}
                      onClick={() => quickReq.setField('days', String(day))}
                    >
                      {day}天
                    </button>
                  ))}
                </div>
              </div>

              {/* 旅行偏好 */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>🎯 旅行偏好</label>
                <div className={styles.preferenceSelector}>
                  {PREFERENCE_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      className={`${styles.prefOption} ${quickReq.state.preferences.includes(opt.key) ? styles.prefOptionActive : ''}`}
                      onClick={() => quickReq.togglePreference(opt.key)}
                    >
                      <span className={styles.prefIcon}>{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                  <div className={styles.customPrefWrap}>
                    <input
                      className={`${styles.customPrefInput} ${quickReq.state.customPreference ? styles.customPrefInputActive : ''}`}
                      type="text"
                      placeholder="✏️ 自定义偏好..."
                      value={quickReq.state.customPreference}
                      onChange={e => quickReq.setCustomPreference(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                </div>
              </div>

              {/* 补充信息 */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>💡 补充信息（可选）</label>
                <textarea
                  className={styles.additionalInput}
                  placeholder="预算范围、同行人员、住宿偏好等补充信息..."
                  value={quickReq.state.additionalInfo}
                  onChange={e => quickReq.setField('additionalInfo', e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              </div>

              {/* 提交按钮 */}
              <button
                className={`${styles.submitBtn} ${!quickReq.isSubmittable ? styles.submitBtnDisabled : ''} ${generating ? styles.submitBtnLoading : ''}`}
                onClick={handleSubmit}
                disabled={!quickReq.isSubmittable || generating}
              >
                {generating ? '⏳ 提交中...' : '⚡ 提交需求，开始生成攻略'}
              </button>

              {!quickReq.isSubmittable && (
                <p className={styles.submitHint}>* 目的地和游玩天数为必填项</p>
              )}
            </>
          )}
        </div>

        {/* 右侧：需求卡片 */}
        <div className={styles.sidePanel}>
          <div className={styles.reqCard}>
            <h4 className={styles.reqCardTitle}>📋 已收集需求</h4>
            <div className={styles.reqTags}>
              {quickReq.state.departure && (
                <span className={styles.reqTag}>
                  🚗 {quickReq.state.departure}
                </span>
              )}
              {quickReq.state.destination && (
                <span className={`${styles.reqTag} ${styles.reqTagHighlight}`}>
                  🏁 {quickReq.state.destination}
                </span>
              )}
              {quickReq.state.travelDate && (
                <span className={styles.reqTag}>
                  📅 {formatDate(quickReq.state.travelDate)}
                </span>
              )}
              {quickReq.state.days && (
                <span className={styles.reqTag}>
                  ⏱ {quickReq.state.days}天
                </span>
              )}
              {allPreferencesText && (
                <span className={styles.reqTag}>
                  🎯 {allPreferencesText.length > 15
                    ? allPreferencesText.slice(0, 15) + '...'
                    : allPreferencesText}
                </span>
              )}
              {quickReq.state.additionalInfo && (
                <span className={styles.reqTag}>
                  💡 有补充
                </span>
              )}
            </div>
            {!quickReq.state.destination && !quickReq.state.departure && !quickReq.state.days && (
              <p className={styles.reqEmpty}>请填写左侧表单</p>
            )}
          </div>

          {/* 进度指示 */}
          <div className={styles.progressCard}>
            <h4 className={styles.reqCardTitle}>📊 填写进度</h4>
            <div className={styles.progressBar}>
              {[
                { key: 'destination', label: '目的地', filled: !!quickReq.state.destination },
                { key: 'departure', label: '出发地', filled: !!quickReq.state.departure },
                { key: 'travelDate', label: '日期', filled: !!quickReq.state.travelDate },
                { key: 'days', label: '天数', filled: !!quickReq.state.days },
                { key: 'preferences', label: '偏好', filled: quickReq.state.preferences.length > 0 || !!quickReq.state.customPreference },
              ].map(item => (
                <div key={item.key} className={styles.progressItem}>
                  <span className={`${styles.progressDot} ${item.filled ? styles.progressDotDone : styles.progressDotEmpty}`} />
                  <span className={item.filled ? styles.progressLabelDone : ''}>{item.label}</span>
                </div>
              ))}
            </div>
            <p className={styles.progressHint}>
              已完成 {[quickReq.state.destination, quickReq.state.departure, quickReq.state.travelDate, quickReq.state.days, (quickReq.state.preferences.length > 0 || !!quickReq.state.customPreference)].filter(Boolean).length}/5 项
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}