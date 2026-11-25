Pod::Spec.new do |s|
  s.name           = 'CodeReader'
  s.version        = '0.1.0'
  s.summary        = 'Barcodes and QR codes from a photo with Apple Vision'
  s.description    = 'Local Expo module: reads barcodes and QR codes on device with Apple Vision.'
  s.author         = 'TaxonWorks'
  s.homepage       = 'https://github.com/SpeciesFileGroup/taxonworks'
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'Vision'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
