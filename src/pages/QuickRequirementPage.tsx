import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useItinerary } from '../context/ItineraryContext';
import { useQuickRequirement, PREFERENCE_OPTIONS, DAYS_OPTIONS } from '../hooks/useQuickRequirement';
import { PROVINCES, getAllCities } from '../data/cities';
import { generateItinerary } from '../services/generateService';
import { createItinerary as saveItinerary } from '../services/itineraryService';
import { enrichItinerary } from '../utils/enrichItinerary';
import type { Requirements } from '../types/conversation';
import type { Material } from '../types/material';
import styles from '../styles/quickRequirement.module.css';

/* ========================================
   模块级存储：用于跨页面共享快速需求数据
   （完全独立于 ConversationContext）
   ======================================== */

let _quickStore: {
  requirements: Requirements | null;
  materials: Material[];
} = {
  requirements: null,
  materials: [],
};

export function setQuickRequirements(req: Requirements) {
  _quickStore.requirements = req;
}

export function getQuickRequirements(): Requirements | null {
  return _quickStore.requirements;
}

export function clearQuickRequirements() {
  _quickStore.requirements = null;
  _quickStore.materials = [];
}

export function addQuickMaterial(material: Material) {
  _quickStore.materials.push(material);
}

export function getQuickMaterials(): Material[] {
  return _quickStore.materials;
}

export function clearQuickMaterials() {
  _quickStore.materials = [];
}

export default function QuickRequirementPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dispatch: itineraryDispatch } = useItinerary();

  const quickReq = useQuickRequirement();

  // 城市选择器状态
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [departureProvince, setDepartureProvince] = useState('');
  const [destProvince, setDestProvince] = useState('');
  const [departureSearch, setDepartureSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  // 流程状态
  const [generating, setGenerating] = useState(false);
  const [showMaterialPrompt, setShowMaterialPrompt] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const generationTriggered = useRef(false);

  const allCities = getAllCities();

  const getCitiesByProvince = (provinceName: string) => {
    const province = PROVINCES.find(p => p.name === provinceName);
    return province ? province.cities : [];
  };

  const handleSelectDeparture = (cityName: string) => {
    quickReq.setField('departure', cityName);
    setShowDeparturePicker(false);
    setDepartureSearch('');
  };

  const handleSelectDestination = (cityName: string) => {
    quickReq.addDestination(cityName);
    // 不关闭弹窗，让用户继续选更多
    setDestSearch('');
  };

  const filteredDepartureCities = departureSearch.trim()
    ? allCities.filter(c => c.name.includes(departureSearch.trim()) || c.province.includes(departureSearch.trim()))
    : [];

  const filteredDestCities = destSearch.trim()
    ? allCities.filter(c => c.name.includes(destSearch.trim()) || c.province.includes(destSearch.trim()))
    : [];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  /**
   * 构建需求对象 & 摘要文本
   */
  const buildRequirementsAndSummary = useCallback(() => {
    const allPrefs = [...quickReq.state.preferences];
    if (quickReq.state.customPreference.trim()) {
      allPrefs.push(quickReq.state.customPreference.trim());
    }
    const prefText = allPrefs.length > 0 ? allPrefs.join('、') : '';

    const destinationText = quickReq.state.destinations.join('、');
    const requirements: Requirements = {
      destination: destinationText,
      departure: quickReq.state.departure,
      travelDate: quickReq.state.travelDate,
      days: quickReq.state.days,
      budget: '',
      companions: '',
      preferences: prefText,
      accommodation: '',
      transport: '',
    };

    const items: string[] = [];
    if (quickReq.state.destinations.length > 0) items.push(`📍 目的地：${destinationText}`);
    if (quickReq.state.departure) items.push(`🚗 出发地：${quickReq.state.departure}`);
    if (quickReq.state.travelDate) items.push(`📅 时间：${formatDate(quickReq.state.travelDate)}`);
    if (quickReq.state.days) items.push(`⏱ 天数：${quickReq.state.days}天`);
    if (prefText) items.push(`🎯 偏好：${prefText}`);

    const summary =
      `太好了！我已经收到你的出行计划 🌟\n\n` +
      `**📋 你填写的需求：**\n${items.join('\n')}\n\n` +
      (quickReq.state.additionalInfo ? `**💡 补充信息：**\n${quickReq.state.additionalInfo}\n\n` : '') +
      `你是否有查看过相关的旅游攻略或帖子是你比较感兴趣的？如果有的话可以上传一些素材，我能为你生成更精准的攻略哦 😊`;

    return { requirements, summary, prefText };
  }, [quickReq.state]);

  /**
   * 提交需求 — 完全独立，不写 ConversationContext
   */
  const handleSubmit = useCallback(async () => {
    if (!quickReq.isSubmittable || generating) return;
    setGenerating(true);

    const { requirements, summary } = buildRequirementsAndSummary();

    // 存储到模块级变量（供后续流程使用）
    setQuickRequirements(requirements);
    setSummaryText(summary);

    setGenerating(false);
    setShowMaterialPrompt(true);
  }, [quickReq, generating, buildRequirementsAndSummary]);

  /**
   * 点击「是，有素材」- 跳转到素材粘贴板（标记 fromQuick）
   */
  const handleGoToUpload = () => {
    navigate('/upload?fromQuick=true');
  };

  /**
   * 点击「否，直接生成」- 直接调用 AI 生成攻略
   */
  const handleGenerateDirectly = async () => {
    if (generationTriggered.current) return;
    generationTriggered.current = true;

    setGenerating(true);
    itineraryDispatch({ type: 'SET_LOADING', payload: true });

    try {
      const { requirements } = buildRequirementsAndSummary();

      const destText = quickReq.state.destinations.join('、');
      const convHistory = [
        { role: 'user' as const, content: `我想去${destText}旅行` },
        { role: 'assistant' as const, content: `好的，我来为你规划${destText}的行程。` },
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

  /**
   * 从素材页返回后（fromUpload=true）：使用模块级存储的素材直接生成
   */
  useEffect(() => {
    const fromUpload = searchParams.get('fromUpload') === 'true';
    if (!fromUpload || generationTriggered.current) return;

    const storedReq = getQuickRequirements();
    const storedMats = getQuickMaterials();
    if (!storedReq || storedMats.length === 0) return;

    generationTriggered.current = true;
    setGenerating(true);
    itineraryDispatch({ type: 'SET_LOADING', payload: true });

    (async () => {
      try {
        const mats = storedMats.map(m => ({ type: m.type as 'text' | 'image', content: m.content }));
        const convHistory = [
          { role: 'user' as const, content: `我想去${storedReq.destination}旅行` },
          { role: 'assistant' as const, content: `好的，我来为你规划${storedReq.destination}的行程。` },
        ];

        const result = await generateItinerary(storedReq, mats, convHistory);

        if (result?.itinerary) {
          const enriched = enrichItinerary(result.itinerary, storedReq);
          saveItinerary({ title: enriched.title, data: enriched, summary: '' })
            .then(saved => { if (saved?.id) enriched.id = saved.id; })
            .catch(() => {});
          itineraryDispatch({ type: 'SET_ITINERARY', payload: enriched });
          itineraryDispatch({ type: 'ADD_TO_LIST', payload: enriched });
        }
      } catch (e) {
        console.error('【快速需求-素材后生成失败】', e);
      }

      setGenerating(false);
      itineraryDispatch({ type: 'SET_LOADING', payload: false });
      navigate('/itinerary');
    })();
  }, [searchParams, itineraryDispatch, navigate]);

  // ===== 渲染 =====
  const allPreferencesText = [
    ...quickReq.state.preferences,
    ...(quickReq.state.customPreference.trim() ? [quickReq.state.customPreference.trim()] : []),
  ].join('、');

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.backButton} onClick={() => navigate('/requirement-choice')}>
          ← 返回上一页
        </button>
        <h2 className={styles.pageTitle}>⚡ 快速填写</h2>
      </div>

      <div className={styles.body}>
        <div className={styles.formSection}>
          {showMaterialPrompt ? (
            /* ===== 素材询问阶段（完全本地渲染，不依赖 ConversationContext） ===== */
            <div className={styles.materialPrompt}>
              <div className={styles.aiMessage}>
                <div className={styles.aiBubble}>{summaryText}</div>
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
                      <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="搜索城市（输入中文或拼音）"
                        value={departureSearch}
                        onChange={e => setDepartureSearch(e.target.value)}
                        autoFocus
                      />

                      {departureSearch.trim() ? (
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
                        <div className={styles.provinceCityList}>
                          {!departureProvince ? (
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

              {/* 目的地（多选） */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>🏁 目的地 <span className={styles.required}>*</span></label>
                <div className={styles.citySelector}>
                  <div
                    className={`${styles.cityInput} ${quickReq.state.destinations.length > 0 ? styles.cityInputFilled : ''}`}
                    onClick={() => { setShowDestPicker(!showDestPicker); setShowDeparturePicker(false); }}
                  >
                    {quickReq.state.destinations.length > 0
                      ? `已选 ${quickReq.state.destinations.length} 个城市`
                      : <span className={styles.placeholder}>请选择目的城市（可多选）▼</span>}
                  </div>

                  {/* 已选目的地标签 */}
                  {quickReq.state.destinations.length > 0 && (
                    <div className={styles.destTags}>
                      {quickReq.state.destinations.map(city => (
                        <span key={city} className={styles.destTag}>
                          🏁 {city}
                          <button
                            className={styles.destTagRemove}
                            onClick={(e) => { e.stopPropagation(); quickReq.removeDestination(city); }}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <span className={styles.destAddHint}>点击输入框继续添加</span>
                    </div>
                  )}

                  {showDestPicker && (
                    <div className={styles.cityPicker}>
                      <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="搜索城市（输入中文或拼音）"
                        value={destSearch}
                        onChange={e => setDestSearch(e.target.value)}
                        autoFocus
                      />

                      {destSearch.trim() ? (
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
              {quickReq.state.destinations.map(city => (
                <span key={city} className={`${styles.reqTag} ${styles.reqTagHighlight}`}>
                  🏁 {city}
                </span>
              ))}
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
            {quickReq.state.destinations.length === 0 && !quickReq.state.departure && !quickReq.state.days && (
              <p className={styles.reqEmpty}>请填写左侧表单</p>
            )}
          </div>

          <div className={styles.progressCard}>
            <h4 className={styles.reqCardTitle}>📊 填写进度</h4>
            <div className={styles.progressBar}>
              {[
                { key: 'destination', label: '目的地', filled: quickReq.state.destinations.length > 0 },
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
              已完成 {[quickReq.state.destinations.length > 0, quickReq.state.departure, quickReq.state.travelDate, quickReq.state.days, (quickReq.state.preferences.length > 0 || !!quickReq.state.customPreference)].filter(Boolean).length}/5 项
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}