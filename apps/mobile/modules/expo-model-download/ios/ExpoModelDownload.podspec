Pod::Spec.new do |s|
  s.name           = 'ExpoModelDownload'
  s.version        = '1.0.0'
  s.summary        = 'Background model download with notifications and resume'
  s.description    = 'Background URLSession model download with progress, cancel and Range resume'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
