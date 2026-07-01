/**
 * AI 服务模块
 * 集成 DeepSeek API（OpenAI 格式接口）
 */

const https = require('https');
const http = require('http');

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';

// OpenAI API 配置
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1';

// Anthropic API 配置
const ANTHROPIC_API_URL = process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1';

/**
 * 调用 DeepSeek API（OpenAI 格式接口）
 * @param {string} prompt - 用户提示
 * @param {object} options - 可选参数
 * @param {string} customApiKey - 用户自定义 API Key（可选）
 * @returns {Promise<object>} - API 返回结果
 */
async function callDeepSeekAPI(prompt, options = {}, customApiKey = null) {
  // 严格检查用户是否配置了 API Key（不使用降级方案）
  if (!customApiKey) {
    throw new Error('请先配置 AI API Key，在设置中添加您的 API Key');
  }

  const apiKey = customApiKey;

  // 默认参数
  const defaultOptions = {
    model: 'deepseek-chat',
    max_tokens: 1000,
    temperature: 0.7,
    stream: false
  };

  const finalOptions = { ...defaultOptions, ...options };

  // 构建请求体
  const requestBody = {
    model: finalOptions.model,
    messages: [
      {
        role: 'system',
        content: '你是一个温柔的日记助手，帮助用户回顾自己的日记内容，发现生活中的美好。你的回复应该是温暖、鼓励性的，使用中文。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: finalOptions.max_tokens,
    temperature: finalOptions.temperature,
    stream: finalOptions.stream
  };

  // 构建请求选项
  const url = new URL(`${DEEPSEEK_API_URL}/chat/completions`);
  const requestOptions = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  };

  // 日志记录
  console.log('🤖 AI 服务调用开始:', {
    url: `${DEEPSEEK_API_URL}/chat/completions`,
    model: finalOptions.model,
    prompt_length: prompt.length,
    timestamp: new Date().toISOString()
  });

  // 发送请求
  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http;

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          // 检查 API 错误
          if (response.error) {
            console.error('❌ DeepSeek API 错误:', response.error);
            reject(new Error(`AI API 错误: ${response.error.message || '未知错误'}`));
            return;
          }

          // 提取结果
          const result = {
            content: response.choices?.[0]?.message?.content || '',
            model: response.model,
            usage: response.usage,
            finish_reason: response.choices?.[0]?.finish_reason
          };

          // 日志记录
          console.log('✅ AI 服务调用成功:', {
            model: result.model,
            content_length: result.content.length,
            usage: result.usage,
            finish_reason: result.finish_reason,
            timestamp: new Date().toISOString()
          });

          resolve(result);
        } catch (error) {
          console.error('❌ 解析 DeepSeek API 响应失败:', error.message);
          reject(new Error('解析 AI API 响应失败'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ DeepSeek API 网络错误:', error.message);
      reject(new Error(`AI API 网络错误: ${error.message}`));
    });

    // 设置超时
    req.setTimeout(30000, () => {
      console.error('❌ DeepSeek API 调用超时');
      req.destroy();
      reject(new Error('AI API 调用超时（30秒）'));
    });

    // 发送请求体
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

/**
 * 数据验证函数：验证 Reflection 数据结构
 * @param {object} data - AI 返回的数据
 * @returns {object} - 验证后的安全数据结构
 */
function validateReflectionData(data) {
  const validMoods = ['calm', 'happy', 'sad', 'anxious', 'inspired', 'reflective'];
  const moodLabels = {
    calm: '平静',
    happy: '开心',
    sad: '悲伤',
    anxious: '焦虑',
    inspired: '充满灵感',
    reflective: '深思'
  };

  const mood = validMoods.includes(data.mood) ? data.mood : 'calm';

  // 验证 emotion_trend 字段
  const defaultEmotionTrend = {
    calm: 0,
    happy: 0,
    sad: 0,
    anxious: 0,
    inspired: 0,
    reflective: 0
  };

  let emotionTrend = defaultEmotionTrend;
  if (data.emotion_trend && typeof data.emotion_trend === 'object') {
    emotionTrend = {
      calm: Math.max(0, Math.min(10, parseInt(data.emotion_trend.calm) || 0)),
      happy: Math.max(0, Math.min(10, parseInt(data.emotion_trend.happy) || 0)),
      sad: Math.max(0, Math.min(10, parseInt(data.emotion_trend.sad) || 0)),
      anxious: Math.max(0, Math.min(10, parseInt(data.emotion_trend.anxious) || 0)),
      inspired: Math.max(0, Math.min(10, parseInt(data.emotion_trend.inspired) || 0)),
      reflective: Math.max(0, Math.min(10, parseInt(data.emotion_trend.reflective) || 0))
    };
  }

  return {
    keywords: Array.isArray(data.keywords) ? data.keywords.slice(0, 5) : [], // 最多 5 个关键词
    observation: typeof data.observation === 'string' ? data.observation : '',
    mood: mood,
    mood_label: typeof data.mood_label === 'string' ? data.mood_label : moodLabels[mood],
    weekly_highlight: typeof data.weekly_highlight === 'string' ? data.weekly_highlight : '',
    emotion_trend: emotionTrend
  };
}

/**
 * AI Reflection 分析函数
 * 分析用户最近 7 天的日记内容
 * @param {string} diaryContent - 日记内容（格式化后的文本）
 * @param {string} customApiKey - 用户自定义 API Key（可选）
 * @param {string} provider - AI 供应商类型（可选，默认 deepseek）
 * @returns {Promise<object>} - 分析结果
 */
async function analyzeReflection(diaryContent, customApiKey = null, provider = 'deepseek') {
  // 🆕 构建结构化 Prompt（支持关键词提取和情绪趋势）
  const structuredPrompt = `你是一个专业的日记分析师。请分析以下日记内容，并返回结构化的 JSON 数据：

最近 7 天的日记内容：
${diaryContent}

请严格按照以下 JSON 格式返回（不要返回其他文本，不要包含 markdown 代码块标记）：
{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "observation": "对最近 7 天日记的整体观察和分析（50-100字）",
  "mood": "calm",
  "mood_label": "平静",
  "weekly_highlight": "本周最值得关注的亮点（30-50字）",
  "emotion_trend": {
    "calm": 0,
    "happy": 0,
    "sad": 0,
    "anxious": 0,
    "inspired": 0,
    "reflective": 0
  }
}

情绪状态可选值：
- calm: 平静
- happy: 开心
- sad: 悲伤
- anxious: 焦虑
- inspired: 充满灵感
- reflective: 深思

emotion_trend 说明：
- 统计日记中每种情绪的出现次数（整数，0-10）
- 根据日记内容判断每种情绪的强度和频率
- 例如：如果日记中多次提到焦虑，anxious 值较高

请确保返回纯 JSON 格式，不要包含任何其他解释文本或 markdown 标记。`;

  try {
    // 根据供应商类型调用对应的 API
    const result = await callAIProviderAPI(provider, structuredPrompt, {
      max_tokens: 500,
      temperature: 0.7
    }, customApiKey);

    // 🆕 解析 AI 返回的 JSON
    let reflectionData;
    try {
      // 尝试直接解析 JSON
      reflectionData = JSON.parse(result.content);
    } catch (parseError) {
      // 如果解析失败，尝试提取 JSON（移除可能的 markdown 标记）
      let cleanContent = result.content;

      // 移除 markdown 代码块标记
      cleanContent = cleanContent.replace(/```json\s*/gi, '');
      cleanContent = cleanContent.replace(/```\s*/gi, '');
      cleanContent = cleanContent.trim();

      // 尝试提取 JSON 对象
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reflectionData = JSON.parse(jsonMatch[0]);
      } else {
        // 降级处理：使用纯文本作为 observation
        console.warn('⚠️ AI 返回非 JSON 格式，使用降级处理');
        reflectionData = {
          keywords: [],
          observation: result.content,
          mood: 'calm',
          mood_label: '平静',
          weekly_highlight: ''
        };
      }
    }

    // 🆕 验证必需字段
    const validatedData = validateReflectionData(reflectionData);

    // 🆕 返回结构化数据（保持向后兼容，添加关键词和情绪趋势）
    return {
      success: true,
      reflection: validatedData.observation || result.content, // 兼容旧逻辑
      keywords: validatedData.keywords,
      observation: validatedData.observation,
      mood: validatedData.mood,
      mood_label: validatedData.mood_label,
      weekly_highlight: validatedData.weekly_highlight,
      emotion_trend: validatedData.emotion_trend,
      model: result.model,
      provider: provider,
      usage: result.usage
    };
  } catch (error) {
    console.error('❌ AI Reflection 分析失败:', error.message);
    return {
      success: false,
      reflection: '抱歉，AI 服务暂时不可用。请稍后再试，或继续写下你的日记。',
      keywords: [],
      observation: '',
      mood: 'calm',
      mood_label: '平静',
      weekly_highlight: '',
      emotion_trend: {
        calm: 0,
        happy: 0,
        sad: 0,
        anxious: 0,
        inspired: 0,
        reflective: 0
      },
      fallback: true,
      error: error.message
    };
  }
}

/**
 * 调用 OpenAI API
 * @param {string} prompt - 用户提示
 * @param {object} options - 可选参数
 * @param {string} customApiKey - 用户自定义 API Key（可选）
 * @returns {Promise<object>} - API 返回结果
 */
async function callOpenAIAPI(prompt, options = {}, customApiKey = null) {
  // 默认参数
  const defaultOptions = {
    model: 'gpt-3.5-turbo',
    max_tokens: 1000,
    temperature: 0.7,
    stream: false
  };

  const finalOptions = { ...defaultOptions, ...options };

  // 构建请求体
  const requestBody = {
    model: finalOptions.model,
    messages: [
      {
        role: 'system',
        content: '你是一个温柔的日记助手，帮助用户回顾自己的日记内容，发现生活中的美好。你的回复应该是温暖、鼓励性的，使用中文。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: finalOptions.max_tokens,
    temperature: finalOptions.temperature,
    stream: finalOptions.stream
  };

  // 构建请求选项
  const url = new URL(`${OPENAI_API_URL}/chat/completions`);
  const requestOptions = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customApiKey}`
    }
  };

  // 日志记录
  console.log('🤖 OpenAI 服务调用开始:', {
    url: `${OPENAI_API_URL}/chat/completions`,
    model: finalOptions.model,
    prompt_length: prompt.length,
    timestamp: new Date().toISOString()
  });

  // 发送请求（使用与 DeepSeek 相同的请求逻辑）
  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http;

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          // 检查 API 错误
          if (response.error) {
            console.error('❌ OpenAI API 错误:', response.error);
            reject(new Error(`OpenAI API 错误: ${response.error.message || '未知错误'}`));
            return;
          }

          // 提取结果
          const result = {
            content: response.choices?.[0]?.message?.content || '',
            model: response.model,
            usage: response.usage,
            finish_reason: response.choices?.[0]?.finish_reason
          };

          // 日志记录
          console.log('✅ OpenAI 服务调用成功:', {
            model: result.model,
            content_length: result.content.length,
            usage: result.usage,
            finish_reason: result.finish_reason,
            timestamp: new Date().toISOString()
          });

          resolve(result);
        } catch (error) {
          console.error('❌ 解析 OpenAI API 响应失败:', error.message);
          reject(new Error('解析 OpenAI API 响应失败'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ OpenAI API 网络错误:', error.message);
      reject(new Error(`OpenAI API 网络错误: ${error.message}`));
    });

    // 设置超时
    req.setTimeout(30000, () => {
      console.error('❌ OpenAI API 调用超时');
      req.destroy();
      reject(new Error('OpenAI API 调用超时（30秒）'));
    });

    // 发送请求体
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

/**
 * 调用 Anthropic API（Claude）
 * @param {string} prompt - 用户提示
 * @param {object} options - 可选参数
 * @param {string} customApiKey - 用户自定义 API Key（可选）
 * @returns {Promise<object>} - API 返回结果
 */
async function callAnthropicAPI(prompt, options = {}, customApiKey = null) {
  // 默认参数
  const defaultOptions = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1000,
    temperature: 0.7
  };

  const finalOptions = { ...defaultOptions, ...options };

  // 构建请求体（Anthropic API 格式）
  const requestBody = {
    model: finalOptions.model,
    max_tokens: finalOptions.max_tokens,
    system: '你是一个温柔的日记助手，帮助用户回顾自己的日记内容，发现生活中的美好。你的回复应该是温暖、鼓励性的，使用中文。',
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  // 构建请求选项
  const url = new URL(`${ANTHROPIC_API_URL}/messages`);
  const requestOptions = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': customApiKey,
      'anthropic-version': '2023-06-01'
    }
  };

  // 日志记录
  console.log('🤖 Anthropic 服务调用开始:', {
    url: `${ANTHROPIC_API_URL}/messages`,
    model: finalOptions.model,
    prompt_length: prompt.length,
    timestamp: new Date().toISOString()
  });

  // 发送请求
  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http;

    const req = protocol.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          // 检查 API 错误
          if (response.error) {
            console.error('❌ Anthropic API 错误:', response.error);
            reject(new Error(`Anthropic API 错误: ${response.error.message || '未知错误'}`));
            return;
          }

          // 提取结果（Anthropic API 格式）
          const result = {
            content: response.content?.[0]?.text || '',
            model: response.model,
            usage: {
              input_tokens: response.usage?.input_tokens,
              output_tokens: response.usage?.output_tokens
            },
            finish_reason: response.stop_reason
          };

          // 日志记录
          console.log('✅ Anthropic 服务调用成功:', {
            model: result.model,
            content_length: result.content.length,
            usage: result.usage,
            finish_reason: result.finish_reason,
            timestamp: new Date().toISOString()
          });

          resolve(result);
        } catch (error) {
          console.error('❌ 解析 Anthropic API 响应失败:', error.message);
          reject(new Error('解析 Anthropic API 响应失败'));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Anthropic API 网络错误:', error.message);
      reject(new Error(`Anthropic API 网络错误: ${error.message}`));
    });

    // 设置超时
    req.setTimeout(30000, () => {
      console.error('❌ Anthropic API 调用超时');
      req.destroy();
      reject(new Error('Anthropic API 调用超时（30秒）'));
    });

    // 发送请求体
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

/**
 * 根据供应商类型调用对应的 API
 * @param {string} provider - 供应商类型（deepseek, openai, anthropic）
 * @param {string} prompt - 用户提示
 * @param {object} options - 可选参数
 * @param {string} customApiKey - 用户自定义 API Key（可选）
 * @returns {Promise<object>} - API 返回结果
 */
async function callAIProviderAPI(provider, prompt, options = {}, customApiKey = null) {
  switch (provider) {
    case 'deepseek':
      return await callDeepSeekAPI(prompt, options, customApiKey);
    case 'openai':
      return await callOpenAIAPI(prompt, options, customApiKey);
    case 'anthropic':
      return await callAnthropicAPI(prompt, options, customApiKey);
    default:
      throw new Error(`不支持的 AI 供应商: ${provider}`);
  }
}

/**
 * 降级方案：当 AI 服务失败时返回友好提示
 * @returns {object} - 降级提示
 */
function getFallbackMessage() {
  return {
    success: false,
    reflection: '抱歉，AI 服务暂时不可用。请稍后再试，或继续写下你的日记。你的每一篇日记都值得珍藏。',
    fallback: true
  };
}

module.exports = {
  callDeepSeekAPI,
  callOpenAIAPI,
  callAnthropicAPI,
  callAIProviderAPI,
  analyzeReflection,
  getFallbackMessage
};